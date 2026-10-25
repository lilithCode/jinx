"use client";

import confetti from "canvas-confetti";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Jar } from "@/components/Jar";
import { REACTIONS } from "@/lib/constants";
import type { DrawView, JarState, PlayerView } from "@/lib/types";

type Phase = "shake" | "roulette" | "reveal";

type Props = {
  state: JarState;
  draw: DrawView;
  animate: boolean;
  busy: boolean;
  onResolve: (outcome: "done" | "chicken" | "veto" | "redraw") => void;
  onReact: (emoji: string) => void;
};

const CONFETTI = ["#f07a9a", "#b65bc2", "#ffb38a", "#9be3c4", "#ffe08a", "#ffffff"];

export function DrawStage({ state, draw, animate, busy, onResolve, onReact }: Props) {
  const reduced = useReducedMotion();
  const play = animate && !reduced;
  const [phase, setPhase] = useState<Phase>(play ? "shake" : "reveal");
  const [spinIdx, setSpinIdx] = useState(0);

  const players = state.players;
  const byId = (id: string | null) => players.find((p) => p.id === id);
  const victim = byId(draw.victimId);
  const author = byId(draw.authorId);
  const isMe = draw.victimId === state.me.id;
  const canRedraw = state.me.role === "host" || isMe;
  const myVeto = draw.vetoVotes.includes(state.me.id);

  // Choreography: rattle the jar, spin the avatar roulette, then unfold the slip.
  useEffect(() => {
    if (!play) {
      setPhase("reveal");
      return;
    }
    setPhase("shake");
    setSpinIdx(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase("roulette"), 1100));
    let t = 1100;
    const frames = Math.max(10, players.length * 3);
    for (let i = 0; i < frames; i++) {
      t += 55 + i * i * 1.6;
      const idx = i;
      timers.push(setTimeout(() => setSpinIdx(idx), t));
    }
    timers.push(setTimeout(() => setPhase("reveal"), t + 500));
    return () => timers.forEach(clearTimeout);
  }, [draw.id, play, players.length]);

  useEffect(() => {
    if (phase !== "reveal" || !play) return;
    confetti({ particleCount: 110, spread: 75, origin: { y: 0.45 }, colors: CONFETTI, disableForReducedMotion: true });
  }, [phase, play]);

  if (phase === "shake") {
    return (
      <div className="stage-inner" aria-live="polite">
        <div className="stage-jar"><Jar slips={state.slips} mood="shaking" /></div>
        <h2>Shaking the jar…</h2>
      </div>
    );
  }

  if (phase === "roulette") {
    // Land on the victim at the end of the sequence.
    const frames = Math.max(10, players.length * 3);
    const order = players.length ? players : [];
    const vIdx = Math.max(0, order.findIndex((p) => p.id === draw.victimId));
    const shownIdx = (vIdx - (frames - 1 - spinIdx) + order.length * 100) % Math.max(1, order.length);
    const p = order[shownIdx] as PlayerView | undefined;
    return (
      <div className="roulette" aria-live="polite">
        <p className="eyebrow" style={{ color: "#fff" }}>Who&rsquo;s on the spot?</p>
        {p && (
          <motion.div key={spinIdx} initial={{ scale: 0.7, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.12 }}>
            <span className="ava" style={{ background: p.color }}>{p.avatar}</span>
          </motion.div>
        )}
        <h2>{p?.name}</h2>
      </div>
    );
  }

  return (
    <>
      <div className="victim">
        <motion.span
          className="ava"
          style={{ background: victim?.color ?? "#fff" }}
          initial={play ? { scale: 0.4, rotate: -20 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 14 }}
        >
          {victim?.avatar ?? "❔"}
        </motion.span>
        <h2>{isMe ? "You're up!" : `${victim?.name ?? "Someone"} is on the spot`}</h2>
      </div>

      <motion.article
        className="slip draw-card"
        style={{ "--tilt": "-1.5deg" } as React.CSSProperties}
        initial={play ? { rotateX: -95, scale: 0.6, opacity: 0, y: 40 } : false}
        animate={{ rotateX: 0, scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 15, delay: play ? 0.15 : 0 }}
        aria-live="polite"
      >
        <p className="dare-text">{draw.dare.text}</p>
        <p className="from">
          {state.jar.anonymous
            ? "Written by: it's a secret 🤫"
            : draw.fromPack
              ? "From a starter pack"
              : `Written by ${author?.name ?? "a player who left"}`}
        </p>
      </motion.article>

      <div className="outcomes">
        <button className="btn btn--mint" disabled={busy} onClick={() => onResolve("done")}>✅ Done it</button>
        <button className="btn btn--peach" disabled={busy} onClick={() => onResolve("chicken")}>🐔 Chicken out</button>
        <button className="btn btn--ghost" style={{ color: "#fff" }} disabled={busy || myVeto} onClick={() => onResolve("veto")}>
          🚫 {myVeto ? "Veto sent" : "Veto slip"}{draw.vetoVotes.length > 0 && state.me.role !== "host" ? ` (${draw.vetoVotes.length}/2)` : ""}
        </button>
        {canRedraw && (
          <button className="btn btn--ghost" style={{ color: "#fff" }} disabled={busy} onClick={() => onResolve("redraw")}>
            🔄 Draw another
          </button>
        )}
      </div>
      <p className="hint" style={{ color: "rgba(255,255,255,0.85)" }}>
        Done: +2 · Chicken out: −1, the slip goes back in · Veto needs two players or the host
      </p>

      <div className="reaction-bar" role="group" aria-label="Send a reaction">
        {REACTIONS.map((r) => (
          <button key={r} onClick={() => onReact(r)} aria-label={`React ${r}`}>{r}</button>
        ))}
      </div>
    </>
  );
}
