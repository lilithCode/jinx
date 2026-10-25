import "server-only";
import { randomInt } from "node:crypto";
import { kv } from "./kv";
import { HttpError, checkPassword, hashPassword, newCode, newId, str } from "./security";
import { AVATARS, JAR_EMOJIS, LIMITS, PLAYER_COLORS, POINTS, type Outcome, normalizeCode } from "../constants";
import { PACKS } from "../packs";
import type { DrawView, JarState } from "../types";

// ---------- document model: one JSON document per jar ----------
// Jars are never deleted automatically: only the host's "Delete jar" removes data.

type Player = {
  id: string; deviceHash: string; name: string; avatar: string; color: string;
  role: "host" | "player"; score: number; joinedAt: number;
};
type Dare = {
  id: string; authorId: string | null; text: string;
  status: "in_jar" | "drawn" | "done" | "vetoed"; timesDrawn: number; createdAt: number;
};
type Draw = {
  id: string; dareId: string; victimId: string | null; drawnBy: string | null;
  outcome: "pending" | Outcome | "redraw"; vetoVotes: string[];
  createdAt: number; resolvedAt: number | null; editedBy?: string | null;
};
export type JarDoc = {
  id: string; code: string; name: string; emoji: string; maxPlayers: number;
  anonymous: boolean; noOwnDares: boolean; passwordHash: string | null; locked: boolean;
  status: "open" | "ended"; createdAt: number;
  players: Player[]; dares: Dare[]; draws: Draw[]; kicked: string[];
};

const MAX_DRAWS_KEPT = 300;
const ONLINE_MS = 15_000;

const K = {
  jar: (id: string) => `jar:${id}`,
  code: (code: string) => `code:${code}`,
  moved: (code: string) => `moved:${code}`,
  ver: (id: string) => `ver:${id}`,
  lock: (id: string) => `lock:${id}`,
  seen: (id: string, pid: string) => `seen:${id}:${pid}`,
  rx: (id: string) => `rx:${id}`,
  rxseq: (id: string) => `rxseq:${id}`,
};

/** Points a finished dare is worth to the player who got it. */
const pointsFor = (o: Draw["outcome"]) => (o === "done" ? POINTS.done : o === "chicken" ? POINTS.chicken : 0);
/** Where a slip ends up after each outcome. */
const slipAfter: Record<Outcome, Dare["status"]> = { done: "done", chicken: "in_jar", veto: "vetoed" };

function cleanName(v: unknown) {
  const name = str(v, LIMITS.nameMax);
  if (name.length < 1) throw new HttpError(400, "Pick a name so friends know who you are.");
  return name;
}

const cleanAvatar = (v: unknown) =>
  AVATARS.includes(v as (typeof AVATARS)[number]) ? (v as string) : AVATARS[0];

// ---------- storage helpers ----------

async function idForCode(code: string): Promise<string | null> {
  const c = normalizeCode(code);
  if (c.length !== LIMITS.codeLength) return null;
  return kv().get<string>(K.code(c));
}

const load = (id: string) => kv().get<JarDoc>(K.jar(id));

async function save(doc: JarDoc) {
  const db = kv();
  await db.set(K.jar(doc.id), doc);
  await db.set(K.code(doc.code), doc.id);
  await db.incr(K.ver(doc.id));
}

async function uniqueCode() {
  for (let i = 0; i < 20; i++) {
    const c = newCode();
    if (!(await kv().get(K.code(c))) && !(await kv().get(K.moved(c)))) return c;
  }
  throw new HttpError(503, "Couldn't make a code. Try again.");
}

/** Serialise writes to one jar: take a short lock, load, change, save. */
async function mutate<T>(id: string, fn: (doc: JarDoc) => T | Promise<T>): Promise<T> {
  const db = kv();
  const token = newId();
  const deadline = Date.now() + 4000;
  while (!(await db.set(K.lock(id), token, { nx: true, px: 5000 }))) {
    if (Date.now() > deadline) throw new HttpError(503, "The jar is busy. Try again.");
    await new Promise((r) => setTimeout(r, 60 + Math.random() * 60));
  }
  try {
    const doc = await load(id);
    if (!doc) throw new HttpError(404, "This jar doesn't exist. The host may have deleted it.");
    const out = await fn(doc);
    doc.draws = doc.draws.slice(-MAX_DRAWS_KEPT);
    await save(doc);
    return out;
  } finally {
    if ((await db.get<string>(K.lock(id))) === token) await db.del(K.lock(id));
  }
}

function findMember(doc: JarDoc, dh: string | null) {
  const me = dh ? doc.players.find((p) => p.deviceHash === dh) : undefined;
  if (!me) {
    if (dh && doc.kicked.includes(dh)) throw new HttpError(403, "The host removed you from this jar.", { removed: true });
    throw new HttpError(403, "You haven't joined this jar yet.", { needsJoin: true });
  }
  return me;
}

/** Finds the jar for a code, forwarding members who still use a code the host replaced. */
async function resolveJarId(code: string, dh: string | null): Promise<string> {
  const id = await idForCode(code);
  if (id) return id;
  const movedId = await kv().get<string>(K.moved(normalizeCode(code)));
  if (movedId) {
    const doc = await load(movedId);
    if (doc && dh && doc.players.some((p) => p.deviceHash === dh))
      throw new HttpError(409, "This jar has a new code.", { movedTo: doc.code });
  }
  throw new HttpError(404, "This jar doesn't exist. The host may have deleted it.");
}

export async function requireMember(code: string, dh: string | null) {
  const id = await resolveJarId(code, dh);
  const jar = await load(id);
  if (!jar) throw new HttpError(404, "This jar doesn't exist. The host may have deleted it.");
  return { jar, me: findMember(jar, dh) };
}

/** Run a change as a seated member. */
async function asMember<T>(code: string, dh: string | null, fn: (jar: JarDoc, me: Player) => T | Promise<T>) {
  const id = await resolveJarId(code, dh);
  return mutate(id, (jar) => fn(jar, findMember(jar, dh)));
}

function requireOpen(jar: JarDoc) {
  if (jar.status === "ended") throw new HttpError(409, "This game has ended.");
}

// ---------- create / peek / join ----------

export async function createJar(body: Record<string, unknown>, dh: string) {
  const name = str(body.name, LIMITS.jarNameMax);
  if (name.length < 1) throw new HttpError(400, "Give your jar a name.");
  const maxPlayers = Math.round(Number(body.maxPlayers));
  if (!(maxPlayers >= LIMITS.minPlayers && maxPlayers <= LIMITS.maxPlayers))
    throw new HttpError(400, `Players must be between ${LIMITS.minPlayers} and ${LIMITS.maxPlayers}.`);
  const emoji = JAR_EMOJIS.includes(body.emoji as (typeof JAR_EMOJIS)[number]) ? (body.emoji as string) : "🫙";
  const password = typeof body.password === "string" ? body.password.slice(0, LIMITS.passwordMax) : "";
  const now = Date.now();

  const doc: JarDoc = {
    id: newId(),
    code: await uniqueCode(),
    name,
    emoji,
    maxPlayers,
    anonymous: !!body.anonymous,
    noOwnDares: body.noOwnDares !== false,
    passwordHash: password ? hashPassword(password) : null,
    locked: false,
    status: "open",
    createdAt: now,
    players: [{
      id: newId(), deviceHash: dh, name: cleanName(body.hostName), avatar: cleanAvatar(body.avatar),
      color: PLAYER_COLORS[0], role: "host", score: 0, joinedAt: now,
    }],
    dares: [],
    draws: [],
    kicked: [],
  };
  await save(doc);
  return { code: doc.code };
}

export async function peekJar(code: string, dh: string | null) {
  const id = await idForCode(code);
  const jar = id ? await load(id) : null;
  if (!jar) return null;
  return {
    code: jar.code,
    name: jar.name,
    emoji: jar.emoji,
    taken: jar.players.length,
    maxPlayers: jar.maxPlayers,
    needsPassword: !!jar.passwordHash,
    locked: jar.locked,
    ended: jar.status === "ended",
    member: !!dh && jar.players.some((p) => p.deviceHash === dh),
    takenAvatars: jar.players.map((p) => p.avatar),
  };
}

export async function joinJar(code: string, dh: string, body: Record<string, unknown>) {
  const id = await idForCode(code);
  if (!id) throw new HttpError(404, "No jar has that code. Check the letters and try again.");
  return mutate(id, (jar) => {
    if (jar.players.some((p) => p.deviceHash === dh)) return { code: jar.code }; // already seated
    if (jar.kicked.includes(dh)) throw new HttpError(403, "The host removed you from this jar.");
    if (jar.status === "ended") throw new HttpError(409, "This game has already ended.");
    if (jar.locked) throw new HttpError(423, "The host has locked this jar.");
    if (jar.passwordHash) {
      const pw = typeof body.password === "string" ? body.password.slice(0, LIMITS.passwordMax) : "";
      if (!pw || !checkPassword(pw, jar.passwordHash))
        throw new HttpError(401, "That jar password is wrong.", { badPassword: true });
    }
    if (jar.players.length >= jar.maxPlayers) throw new HttpError(409, "Every seat in this jar is taken.");
    const name = cleanName(body.name);
    if (jar.players.some((p) => p.name.toLowerCase() === name.toLowerCase()))
      throw new HttpError(409, `Someone in this jar is already called ${name}. Try another name.`);
    const used = new Set(jar.players.map((p) => p.color));
    const color = PLAYER_COLORS.find((c) => !used.has(c)) ?? PLAYER_COLORS[jar.players.length % PLAYER_COLORS.length];
    jar.players.push({
      id: newId(), deviceHash: dh, name, avatar: cleanAvatar(body.avatar), color, role: "player", score: 0, joinedAt: Date.now(),
    });
    return { code: jar.code };
  });
}

// ---------- state (filtered per viewer: sealed slips never leave the server) ----------

function drawView(jar: JarDoc, d: Draw): DrawView | null {
  const dare = jar.dares.find((x) => x.id === d.dareId);
  if (!dare) return null;
  const showAuthor = !jar.anonymous;
  return {
    id: d.id,
    dare: { text: dare.text },
    victimId: d.victimId,
    drawnById: d.drawnBy,
    authorId: showAuthor ? dare.authorId : null,
    fromPack: showAuthor && dare.authorId === null,
    outcome: d.outcome,
    vetoVotes: d.vetoVotes,
    createdAt: d.createdAt,
    resolvedAt: d.resolvedAt,
    editedBy: d.editedBy ?? null,
  };
}

export async function jarState(jar: JarDoc, me: Player): Promise<JarState> {
  const db = kv();
  // Reading state doubles as this player's "I'm here" heartbeat.
  await db.set(K.seen(jar.id, me.id), 1, { px: ONLINE_MS });
  const [ver, ...seen] = await db.mget<number>(K.ver(jar.id), ...jar.players.map((p) => K.seen(jar.id, p.id)));
  const onlineIds = new Set(jar.players.filter((_, i) => seen[i]).map((p) => p.id));
  onlineIds.add(me.id);

  const inJar = jar.dares.filter((d) => d.status === "in_jar").sort((a, b) => (a.id < b.id ? -1 : 1));
  const colorOf = new Map(jar.players.map((p) => [p.id, p.color]));
  const anon = jar.anonymous;
  const pending = jar.draws.find((d) => d.outcome === "pending");
  const history = jar.draws
    .filter((d) => d.outcome !== "pending")
    .sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0))
    .slice(0, 100);

  return {
    version: Number(ver) || 0,
    now: Date.now(),
    jar: {
      id: jar.id,
      code: jar.code,
      name: jar.name,
      emoji: jar.emoji,
      maxPlayers: jar.maxPlayers,
      anonymous: anon,
      noOwnDares: jar.noOwnDares,
      locked: jar.locked,
      ended: jar.status === "ended",
      hasPassword: !!jar.passwordHash,
    },
    me: { id: me.id, role: me.role },
    players: jar.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      color: p.color,
      role: p.role,
      score: p.score,
      online: onlineIds.has(p.id),
      slips: anon ? null : inJar.filter((d) => d.authorId === p.id).length,
    })),
    slips: inJar.map((d) => ({
      id: d.id.slice(0, 6),
      color: anon || !d.authorId ? "#FFF3E6" : (colorOf.get(d.authorId) ?? "#FFF3E6"),
    })),
    myDares: jar.dares
      .filter((d) => d.authorId === me.id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((d) => ({ id: d.id, text: d.text, status: d.status })),
    draw: pending ? drawView(jar, pending) : null,
    history: history.map((h) => drawView(jar, h)).filter((h): h is DrawView => !!h),
  };
}

export async function stateFor(code: string, dh: string | null) {
  const { jar, me } = await requireMember(code, dh);
  return jarState(jar, me);
}

// ---------- slips ----------

function validateDare(body: Record<string, unknown>) {
  const text = str(body.text, LIMITS.dareMax + 1);
  if (text.length < LIMITS.dareMin) throw new HttpError(400, "Write a dare of at least a few words.");
  if (text.length > LIMITS.dareMax) throw new HttpError(400, `Keep dares under ${LIMITS.dareMax} characters.`);
  return text;
}

export const addDare = (code: string, dh: string | null, body: Record<string, unknown>) =>
  asMember(code, dh, (jar, me) => {
    requireOpen(jar);
    const text = validateDare(body);
    if (jar.dares.filter((d) => d.authorId === me.id).length >= LIMITS.slipsPerPlayer)
      throw new HttpError(409, `You've written ${LIMITS.slipsPerPlayer} slips, the max per player.`);
    if (jar.dares.length >= LIMITS.slipsPerJar) throw new HttpError(409, "This jar is full to the lid.");
    jar.dares.push({ id: newId(), authorId: me.id, text, status: "in_jar", timesDrawn: 0, createdAt: Date.now() });
  });

function ownSlipInJar(jar: JarDoc, me: Player, id: unknown) {
  const dare = jar.dares.find((d) => d.id === id);
  if (!dare || dare.authorId !== me.id) throw new HttpError(404, "That slip isn't yours or is gone.");
  if (dare.status !== "in_jar") throw new HttpError(409, "That slip has already been drawn.");
  return dare;
}

export const editDare = (code: string, dh: string | null, body: Record<string, unknown>) =>
  asMember(code, dh, (jar, me) => {
    requireOpen(jar);
    ownSlipInJar(jar, me, body.id).text = validateDare(body);
  });

export const deleteDare = (code: string, dh: string | null, body: Record<string, unknown>) =>
  asMember(code, dh, (jar, me) => {
    const dare = ownSlipInJar(jar, me, body.id);
    jar.dares = jar.dares.filter((d) => d !== dare);
  });

// ---------- the draw ----------

/** Picks the victim (fewest turns so far, ties random) and a random eligible slip. Server-side only. */
function drawOnce(jar: JarDoc, drawnBy: Player) {
  if (jar.draws.some((d) => d.outcome === "pending"))
    throw new HttpError(409, "Someone's dare is still open. Finish it first.");

  const turns = new Map<string, number>();
  for (const d of jar.draws)
    if (d.outcome !== "redraw" && d.victimId) turns.set(d.victimId, (turns.get(d.victimId) ?? 0) + 1);
  const order = jar.players
    .map((p) => ({ p, k: (turns.get(p.id) ?? 0) * 1000 + randomInt(1000) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.p);

  const allowed = jar.dares.filter((d) => d.status === "in_jar");
  if (!allowed.length) throw new HttpError(409, "The jar is empty. Write a few slips first!");

  for (const victim of order) {
    const eligible = jar.noOwnDares ? allowed.filter((d) => d.authorId !== victim.id) : allowed;
    if (!eligible.length) continue;
    const dare = eligible[randomInt(eligible.length)];
    dare.status = "drawn";
    dare.timesDrawn++;
    const draw: Draw = {
      id: newId(), dareId: dare.id, victimId: victim.id, drawnBy: drawnBy.id,
      outcome: "pending", vetoVotes: [], createdAt: Date.now(), resolvedAt: null,
    };
    jar.draws.push(draw);
    return draw.id;
  }
  throw new HttpError(409, "Only your own slips are left. Get your friends to add some!");
}

export const shake = (code: string, dh: string | null) =>
  asMember(code, dh, (jar, me) => {
    requireOpen(jar);
    return { drawId: drawOnce(jar, me) };
  });

export const resolveDraw = (code: string, dh: string | null, body: Record<string, unknown>) =>
  asMember(code, dh, (jar, me) => {
    requireOpen(jar);
    const outcome = body.outcome;
    if (!["done", "chicken", "veto", "redraw"].includes(outcome as string)) throw new HttpError(400, "Unknown outcome.");
    const draw = jar.draws.find((d) => d.id === body.drawId);
    if (!draw || draw.outcome !== "pending") throw new HttpError(409, "That dare was already settled.");
    const dare = jar.dares.find((d) => d.id === draw.dareId);
    const victim = jar.players.find((p) => p.id === draw.victimId);
    const settle = (o: Draw["outcome"], status: Dare["status"]) => {
      draw.outcome = o;
      draw.resolvedAt = Date.now();
      if (dare) dare.status = status;
      if (victim) victim.score += pointsFor(o);
    };

    switch (outcome) {
      case "done":
      case "chicken":
        settle(outcome, slipAfter[outcome]);
        return { redrawn: null };
      case "veto": {
        // Host alone, or any two different players, can remove a slip forever.
        const votes = new Set(draw.vetoVotes).add(me.id);
        draw.vetoVotes = [...votes];
        if (me.role === "host" || votes.size >= 2) settle("veto", "vetoed");
        return { redrawn: null };
      }
      default: {
        if (me.role !== "host" && me.id !== draw.victimId)
          throw new HttpError(403, "Only the host or the player on the spot can redraw.");
        settle("redraw", "in_jar");
        try {
          return { redrawn: drawOnce(jar, me) };
        } catch {
          return { redrawn: null };
        }
      }
    }
  });

/**
 * Change the result of a past dare (e.g. someone chickened out but did it later).
 * The host, or the player who got the dare, can do this. Scores are recalculated.
 */
export const editHistory = (code: string, dh: string | null, body: Record<string, unknown>) =>
  asMember(code, dh, (jar, me) => {
    const next = body.outcome as Outcome;
    if (!(next in slipAfter)) throw new HttpError(400, "Unknown outcome.");
    const draw = jar.draws.find((d) => d.id === body.drawId);
    if (!draw || draw.outcome === "pending" || draw.outcome === "redraw")
      throw new HttpError(404, "That dare isn't in the history.");
    if (me.role !== "host" && me.id !== draw.victimId)
      throw new HttpError(403, "Only the host or the player who got this dare can change it.");
    if (draw.outcome === next) return {};

    const victim = jar.players.find((p) => p.id === draw.victimId);
    if (victim) victim.score += pointsFor(next) - pointsFor(draw.outcome);
    // Move the slip only if this was its latest draw and it isn't being dared right now.
    const dare = jar.dares.find((d) => d.id === draw.dareId);
    const latest = [...jar.draws].reverse().find((d) => d.dareId === draw.dareId);
    if (dare && latest === draw && dare.status !== "drawn") dare.status = slipAfter[next];
    draw.outcome = next;
    draw.editedBy = me.id;
    return {};
  });

/** Cancel any open dare and put its slip back. */
function cancelPending(jar: JarDoc, onlyVictim?: string) {
  for (const d of jar.draws) {
    if (d.outcome !== "pending" || (onlyVictim && d.victimId !== onlyVictim)) continue;
    d.outcome = "redraw";
    d.resolvedAt = Date.now();
    const dare = jar.dares.find((x) => x.id === d.dareId);
    if (dare) dare.status = "in_jar";
  }
}

// ---------- reactions (short-lived, not stored in the jar) ----------

export async function react(code: string, dh: string | null, emoji: string) {
  const { jar, me } = await requireMember(code, dh);
  const db = kv();
  const seq = await db.incr(K.rxseq(jar.id));
  await db.rpush(K.rx(jar.id), { seq, emoji, playerId: me.id });
  await db.ltrim(K.rx(jar.id), -30, -1);
}

/** Cheap poll: version number + any new reactions. Reveals nothing secret, so no seat check. */
export async function live(jarId: string, afterRx: number) {
  const db = kv();
  const [ver, rxseq] = await db.mget<number>(K.ver(jarId), K.rxseq(jarId));
  const seq = Number(rxseq) || 0;
  const reactions =
    seq > afterRx
      ? (await db.lrange<{ seq: number; emoji: string; playerId: string }>(K.rx(jarId), -20, -1)).filter((r) => r.seq > afterRx)
      : [];
  return { v: Number(ver) || 0, rx: seq, reactions };
}

// ---------- host controls ----------

export async function hostAction(code: string, dh: string | null, body: Record<string, unknown>) {
  const action = body.action;
  if (action === "delete") {
    const { jar, me } = await requireMember(code, dh);
    if (me.role !== "host") throw new HttpError(403, "Only the jar's host can do that.");
    const db = kv();
    for (const k of [K.jar(jar.id), K.code(jar.code), K.rx(jar.id), K.rxseq(jar.id)]) await db.del(k);
    await db.incr(K.ver(jar.id));
    return { deleted: true };
  }

  return asMember(code, dh, async (jar, me) => {
    if (me.role !== "host") throw new HttpError(403, "Only the jar's host can do that.");
    switch (action) {
      case "lock":
      case "unlock":
        jar.locked = action === "lock";
        return {};
      case "newCode": {
        const fresh = await uniqueCode();
        await kv().del(K.code(jar.code));
        // Members still on the old URL get forwarded for a few hours; strangers just see "not found".
        await kv().set(K.moved(jar.code), jar.id, { px: 6 * 60 * 60 * 1000 });
        jar.code = fresh;
        return { code: fresh };
      }
      case "remove": {
        const target = jar.players.find((p) => p.id === body.playerId);
        if (!target) throw new HttpError(404, "That player already left.");
        if (target.id === me.id) throw new HttpError(400, "You can't remove yourself. End the game instead.");
        cancelPending(jar, target.id);
        // Their unread slips leave with them; drawn ones stay in history.
        jar.dares = jar.dares.filter((d) => !(d.authorId === target.id && d.status === "in_jar"));
        jar.players = jar.players.filter((p) => p.id !== target.id);
        jar.kicked.push(target.deviceHash);
        return {};
      }
      case "rules":
        jar.anonymous = !!body.anonymous;
        jar.noOwnDares = !!body.noOwnDares;
        return {};
      case "pack": {
        requireOpen(jar);
        const pack = PACKS.find((p) => p.id === body.packId);
        if (!pack) throw new HttpError(404, "Unknown pack.");
        if (jar.dares.length + pack.dares.length > LIMITS.slipsPerJar) throw new HttpError(409, "This jar is full to the lid.");
        for (const text of pack.dares)
          jar.dares.push({ id: newId(), authorId: null, text, status: "in_jar", timesDrawn: 0, createdAt: Date.now() });
        return { added: pack.dares.length };
      }
      case "end":
        cancelPending(jar);
        jar.status = "ended";
        jar.locked = true;
        return {};
      case "reopen":
        jar.status = "open";
        return {};
      default:
        throw new HttpError(400, "Unknown host action.");
    }
  });
}

export const leaveJar = (code: string, dh: string | null) =>
  asMember(code, dh, (jar, me) => {
    if (me.role === "host") throw new HttpError(400, "Hosts can't leave. Delete the jar instead.");
    cancelPending(jar, me.id);
    jar.dares = jar.dares.filter((d) => !(d.authorId === me.id && d.status === "in_jar"));
    jar.players = jar.players.filter((p) => p.id !== me.id);
  });
