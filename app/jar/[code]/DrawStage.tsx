"use client";

import confetti from "canvas-confetti";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Jar } from "@/components/Jar";
import { REACTIONS } from "@/lib/constants";
import type { DrawView, JarState } from "@/lib/types";

type Phase = "shake" | "reveal";

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

  const players = state.players;
  const byId = (id: string | null) => players.find((p) => p.id === id);
  const victim = byId(draw.victimId);
  const author = byId(draw.authorId);
  const isMe = draw.victimId === state.me.id;
  const canRedraw = state.me.role === "host" || isMe;
  const myVeto = draw.vetoVotes.includes(state.me.id);

  // Choreography: rattle the jar on every screen, then unfold the slip.
  useEffect(() => {
    if (!play) {
      setPhase("reveal");
      return;
    }
    setPhase("shake");
    const t = setTimeout(() => setPhase("reveal"), 1600);
    return () => clearTimeout(t);
  }, [draw.id, play]);

  useEffect(() => {
    if (phase !== "reveal" || !play) return;
    confetti({ particleCount: 110, spread: 75, origin: { y: 0.45 }, colors: CONFETTI, disableForReducedMotion: true });
  }, [phase, play]);

  if (phase === "shake") {
    return (
      <div className="stage-inner" aria-live="polite">
        <div className="stage-jar"><Jar slips={state.slips} mood="shaking" /></div>
        <h2>{isMe ? "Shaking the jar for you…" : `${victim?.name ?? "Someone"} is shaking the jar…`}</h2>
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
        Done: +2 · Chicken out: −1 · Either way the slip goes back in the jar · Veto removes it for good (two players or the host)
      </p>

      <div className="reaction-bar" role="group" aria-label="Send a reaction">
        {REACTIONS.map((r) => (
          <button key={r} onClick={() => onReact(r)} aria-label={`React ${r}`}>{r}</button>
        ))}
      </div>
    </>
  );
}
