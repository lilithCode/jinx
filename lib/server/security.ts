import "server-only";
import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { CODE_ALPHABET, LIMITS } from "../constants";
import { kv } from "./kv";

export const DEVICE_COOKIE = "dj_device";

export class HttpError extends Error {
  constructor(public status: number, message: string, public extra?: Record<string, unknown>) {
    super(message);
  }
}

// ---------- device identity (no accounts) ----------

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Returns the caller's device token, minting one if missing. Only the hash is ever stored. */
export function deviceToken(req: NextRequest): { token: string; fresh: boolean } {
  const existing = req.cookies.get(DEVICE_COOKIE)?.value;
  if (existing && /^[A-Za-z0-9_-]{43}$/.test(existing)) return { token: existing, fresh: false };
  return { token: randomBytes(32).toString("base64url"), fresh: true };
}

export function setDeviceCookie(res: NextResponse, token: string) {
  res.cookies.set(DEVICE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function deviceHash(req: NextRequest): string | null {
  const t = req.cookies.get(DEVICE_COOKIE)?.value;
  return t ? sha256(t) : null;
}

// ---------- codes & ids ----------

export function newCode(): string {
  let s = "";
  for (let i = 0; i < LIMITS.codeLength; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return s;
}

export const newId = () => randomBytes(12).toString("base64url");

// ---------- passwords (optional jar password) ----------

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(pw, salt, 32);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export function checkPassword(pw: string, stored: string): boolean {
  const [saltHex, keyHex] = stored.split(":");
  const key = scryptSync(pw, Buffer.from(saltHex, "hex"), 32);
  return timingSafeEqual(key, Buffer.from(keyHex, "hex"));
}

// ---------- request hygiene ----------

export function clientIp(req: NextRequest): string {
  // Behind a proxy, trust only the first hop it reports.
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}

/** Reject cross-site writes. Cookies are SameSite=Lax, this is belt and braces. */
export function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return; // same-origin fetches from older browsers / curl
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (new URL(origin).host !== host) throw new HttpError(403, "Cross-site request blocked.");
}

export async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 8_000) throw new HttpError(413, "That request is too large.");
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

export const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";

// ---------- rate limiting (fixed window, shared via Redis) ----------

export async function rateLimit(key: string, max: number, windowMs: number) {
  const db = kv();
  const k = `rl:${key}`;
  const n = await db.incr(k);
  if (n === 1) await db.pexpire(k, windowMs);
  if (n > max) {
    const wait = Math.ceil(windowMs / 1000);
    throw new HttpError(429, `Too many tries. Wait ${wait < 120 ? `${wait} seconds` : `${Math.ceil(wait / 60)} minutes`} and try again.`, { retryAfter: wait });
  }
}

/** Wraps a route handler: maps HttpError to JSON, hides everything else. */
export function handle<A extends unknown[]>(fn: (req: NextRequest, ...a: A) => Promise<Response>) {
  return async (req: NextRequest, ...a: A) => {
    try {
      if (req.method !== "GET") assertSameOrigin(req);
      return await fn(req, ...a);
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json({ error: e.message, ...e.extra }, { status: e.status });
      }
      console.error(e);
      return NextResponse.json({ error: "Something broke on our side. Try again." }, { status: 500 });
    }
  };
}
