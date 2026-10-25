"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { LIMITS, type Outcome } from "@/lib/constants";
import type { DrawView, JarState } from "@/lib/types";

const STATUS_LABEL = { in_jar: "In the jar", drawn: "Being dared right now", done: "Done ✓", vetoed: "Vetoed" } as const;

type SlipsProps = {
  state: JarState;
  toast: (m: string, kind?: "error") => void;
  hidden: boolean;
  setHidden: (h: boolean) => void;
};

export function SlipsPanel({ state, toast, hidden, setHidden }: SlipsProps) {
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const code = state.jar.code;
  const mineInJar = state.myDares.filter((d) => d.status === "in_jar").length;
  const ended = state.jar.ended;

  const submit = async () => {
    const t = text.trim();
    if (t.length < LIMITS.dareMin || busy) return;
    setBusy(true);
    try {
      await api(`/api/jar/${code}/${editing ? "edit" : "add"}`, { id: editing, text: t });
      setText("");
      toast(editing ? "Slip updated" : "Slip dropped in the jar");
      setEditing(null);
      box.current?.focus();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't save that slip.", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api(`/api/jar/${code}/delete`, { id });
      if (editing === id) {
        setEditing(null);
        setText("");
      }
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't remove that slip.", "error");
    }
  };

  const others = state.players.filter((p) => p.id !== state.me.id);

  return (
    <section className="panel" aria-labelledby="slips-title">
      <div className="panel-head">
        <h2 id="slips-title">My slips</h2>
        <button className="btn btn--ghost btn--sm" onClick={() => setHidden(!hidden)} aria-pressed={!hidden}>
          {hidden ? "👁 Show my slips" : "🙈 Hide my slips"}
        </button>
      </div>
      <p className="hint">
        {state.myDares.length}/{LIMITS.slipsPerPlayer} written · {mineInJar} in the jar.
        {hidden ? " Hidden, so it's safe to share your screen." : " Visible on your screen right now."}
      </p>

      {!ended && (
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="sr-only" htmlFor="dare-text">Write a dare</label>
          <textarea
            id="dare-text"
            ref={box}
            className={`input${hidden ? " masked" : ""}`}
            rows={3}
            maxLength={LIMITS.dareMax}
            placeholder="Dare someone to… (Enter drops it in)"
            value={text}
            autoComplete="off"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
              if (e.key === "Escape" && editing) {
                setEditing(null);
                setText("");
              }
            }}
          />
          <div className="btn-row">
            <button className="btn btn--primary" disabled={busy || text.trim().length < LIMITS.dareMin} style={{ flex: 1 }}>
              {editing ? "Save slip" : "Drop it in the jar"}
            </button>
            {editing && (
              <button type="button" className="btn btn--ghost" onClick={() => { setEditing(null); setText(""); }}>
                Cancel
              </button>
            )}
          </div>
          <p className="hint">Only you can read your slips until the jar draws them.</p>
        </form>
      )}

      {state.myDares.length === 0 ? (
        <div className="empty">
          <span className="big" aria-hidden="true">✍️</span>
          <p>No slips yet. Write your first dare above.</p>
        </div>
      ) : hidden ? (
        <button className="slips-cover" onClick={() => setHidden(false)}>
          <span aria-hidden="true">🙈</span> {state.myDares.length} {state.myDares.length === 1 ? "slip" : "slips"} hidden · tap to show
        </button>
      ) : (
        <ul className="slip-list">
          <AnimatePresence initial={false}>
            {state.myDares.map((d) => (
              <motion.li
                key={d.id}
                className="my-slip"
                data-status={d.status}
                layout
                initial={{ opacity: 0, y: -16, rotate: -3 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <div>
                  <p>{d.text}</p>
                  <span className="tag">{STATUS_LABEL[d.status]}</span>
                </div>
                {d.status === "in_jar" && !ended && (
                  <div className="actions">
                    <button
                      className="tiny-btn"
                      aria-label="Edit slip"
                      title="Edit"
                      onClick={() => {
                        setEditing(d.id);
                        setText(d.text);
                        box.current?.focus();
                      }}
                    >
                      ✏️
                    </button>
                    <button className="tiny-btn" aria-label="Delete slip" title="Delete" onClick={() => remove(d.id)}>🗑️</button>
                  </div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {!state.jar.anonymous && others.length > 0 && (
        <div className="field">
          <span>Friends&rsquo; slips (sealed)</span>
          <ul className="player-list">
            {others.map((p) => (
              <li key={p.id} className="player-row" style={{ gridTemplateColumns: "auto 1fr" }}>
                <span className="ava ava--sm" style={{ background: p.color }}>{p.avatar}</span>
                <span>{p.name} · <b>{p.slips ?? 0}</b> {p.slips === 1 ? "slip" : "slips"} folded</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function ScoresPanel({ state }: { state: JarState }) {
  const ranked = [...state.players].sort((a, b) => b.score - a.score);
  const seatsLeft = state.jar.maxPlayers - state.players.length;
  return (
    <section className="panel" aria-labelledby="scores-title">
      <div className="panel-head">
        <h2 id="scores-title">Scoreboard</h2>
        <span className="hint">{state.players.filter((p) => p.online).length} here now</span>
      </div>
      <ol className="player-list">
        {ranked.map((p, i) => (
          <li key={p.id} className="player-row">
            <span className="ava" data-online={p.online} style={{ background: p.color }} title={p.online ? "Here now" : "Away"}>
              {p.avatar}
            </span>
            <span>
              <b>{i === 0 && p.score > 0 ? "🏆 " : ""}{p.name}{p.id === state.me.id ? " (you)" : ""}</b>
              <small>{p.role === "host" ? "👑 Host · " : ""}{p.online ? "Here now" : "Away"}</small>
            </span>
            <span className="score" aria-label={`${p.score} points`}>{p.score}</span>
          </li>
        ))}
      </ol>
      {seatsLeft > 0 && !state.jar.locked && (
        <p className="hint">{seatsLeft} {seatsLeft === 1 ? "seat" : "seats"} still open. Share the code {state.jar.code} to fill them.</p>
      )}
    </section>
  );
}

const OUTCOME: Record<Outcome, { label: string; pick: string; cls: string }> = {
  done: { label: "Done", pick: "✅ Done", cls: "badge--done" },
  chicken: { label: "Chickened out", pick: "🐔 Chickened out", cls: "badge--chicken" },
  veto: { label: "Vetoed", pick: "🚫 Vetoed", cls: "badge--veto" },
};

export function HistoryPanel({ state, toast }: { state: JarState; toast: (m: string, kind?: "error") => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const items = state.history.filter((h): h is DrawView & { outcome: Outcome } => h.outcome in OUTCOME);
  const name = (id: string | null) => state.players.find((p) => p.id === id)?.name ?? "someone who left";
  const done = items.filter((i) => i.outcome === "done").length;

  const change = async (drawId: string, outcome: Outcome) => {
    setBusy(true);
    try {
      await api(`/api/jar/${state.jar.code}/history`, { drawId, outcome });
      toast(`Changed to "${OUTCOME[outcome].label}". Scores updated.`);
      setEditing(null);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't change that.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="history-title">
      <div className="panel-head">
        <h2 id="history-title">Hall of fame</h2>
        <span className="hint">{done} {done === 1 ? "dare" : "dares"} done</span>
      </div>
      {items.length === 0 ? (
        <div className="empty">
          <span className="big" aria-hidden="true">📜</span>
          <p>Nothing here yet. Every dare that gets done, dodged or vetoed lands here.</p>
        </div>
      ) : (
        <ul className="slip-list">
          {items.map((h) => {
            const canEdit = state.me.role === "host" || h.victimId === state.me.id;
            return (
              <li key={h.id} className="history-item">
                <div className="history-top">
                  <span>
                    <span className={`badge ${OUTCOME[h.outcome].cls}`}>{OUTCOME[h.outcome].label}</span>
                    {h.editedBy && <span className="edited"> · changed by {name(h.editedBy)}</span>}
                  </span>
                  {canEdit && editing !== h.id && (
                    <button className="tiny-btn" aria-label="Change result" title="Change result" onClick={() => setEditing(h.id)}>✏️</button>
                  )}
                </div>
                <p>{h.dare.text}</p>
                <span className="who">
                  {name(h.victimId)}
                  {!state.jar.anonymous && ` · by ${h.fromPack ? "a starter pack" : name(h.authorId)}`}
                </span>
                {editing === h.id && (
                  <div className="btn-row" role="group" aria-label="Change result to">
                    {(Object.keys(OUTCOME) as Outcome[]).map((o) => (
                      <button
                        key={o}
                        className={`btn btn--sm ${o === h.outcome ? "btn--primary" : "btn--ghost"}`}
                        disabled={busy}
                        onClick={() => change(h.id, o)}
                      >
                        {OUTCOME[o].pick}
                      </button>
                    ))}
                    <button className="btn btn--sm btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
