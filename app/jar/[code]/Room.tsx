"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Jar } from "@/components/Jar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ApiError, api, copyText, inviteLink } from "@/lib/api";
import { DrawStage } from "./DrawStage";
import { JarMenu } from "./JarMenu";
import { HistoryPanel, ScoresPanel, SlipsPanel } from "./Panels";
import { Recap } from "./Recap";
import { useJar } from "./useJar";

type Tab = "jar" | "slips" | "scores" | "history";
type Floater = { id: number; emoji: string; left: number; drift: number; name: string };

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "jar", icon: "🫙", label: "Jar" },
  { id: "slips", icon: "✍️", label: "My slips" },
  { id: "scores", icon: "🏆", label: "Scores" },
  { id: "history", icon: "📜", label: "History" },
];

export function Room({ code }: { code: string }) {
  const [tab, setTab] = useState<Tab>("jar");
  const [animateId, setAnimateId] = useState<string | null>(null);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [toastMsg, setToastMsg] = useState<{ text: string; kind?: "error" } | null>(null);
  const [menu, setMenu] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [busy, setBusy] = useState(false);
  // Slips start hidden so nobody sees them if you share your screen on a call.
  const [slipsHidden, setSlipsHidden] = useState(true);
  const [bigScreen, setBigScreen] = useState(false);
  const floaterId = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const namesRef = useRef(new Map<string, string>());

  const toast = useCallback((text: string, kind?: "error") => {
    setToastMsg({ text, kind });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2800);
  }, []);

  const { state, gone, live } = useJar(code, {
    onDraw: (id) => {
      setAnimateId(id);
      setTab("jar");
      setSlipsHidden(true);
    },
    onReaction: (emoji, playerId) => {
      const id = ++floaterId.current;
      const f = { id, emoji, left: 8 + Math.random() * 84, drift: (Math.random() - 0.5) * 120, name: namesRef.current.get(playerId) ?? "" };
      setFloaters((fs) => [...fs.slice(-24), f]);
      setTimeout(() => setFloaters((fs) => fs.filter((x) => x.id !== id)), 2700);
    },
  });

  if (state) namesRef.current = new Map(state.players.map((p) => [p.id, p.name]));

  if (gone) {
    return (
      <main className="wrap flow" style={{ display: "grid", placeItems: "center" }}>
        <section className="flow-card" style={{ textAlign: "center", justifyItems: "center" }}>
          <div style={{ width: 150 }}><Jar mood="sleepy" /></div>
          <h1>This jar is gone</h1>
          <p className="muted">{gone}</p>
          <Link href="/" className="btn btn--primary">Back home</Link>
        </section>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="wrap flow" style={{ display: "grid", placeItems: "center" }}>
        <div style={{ width: 140 }} aria-busy="true"><Jar mood="happy" title="Loading the jar" /></div>
      </main>
    );
  }

  const { jar, players, draw } = state;
  const slipCount = state.slips.length;
  const online = players.filter((p) => p.online).length;
  const lastDone = state.history.find((h) => h.outcome !== "redraw");
  const sideTab: Exclude<Tab, "jar"> = tab === "jar" ? "slips" : tab;

  const doShake = async () => {
    setShaking(true);
    try {
      const out = await api<{ drawId: string }>(`/api/jar/${jar.code}/shake`);
      setAnimateId(out.drawId);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "The jar is stuck. Try again.", "error");
    } finally {
      setTimeout(() => setShaking(false), 300);
    }
  };

  const resolve = async (outcome: "done" | "chicken" | "veto" | "redraw") => {
    if (!draw) return;
    setBusy(true);
    try {
      await api(`/api/jar/${jar.code}/resolve`, { drawId: draw.id, outcome });
      if (outcome === "veto" && state.me.role !== "host" && draw.vetoVotes.length === 0)
        toast("Veto sent. One more player has to agree.");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "That didn't work.", "error");
    } finally {
      setBusy(false);
    }
  };

  const react = (emoji: string) => {
    api(`/api/jar/${jar.code}/react`, { emoji }).catch(() => {});
  };

  return (
    <div className="room">
      <header className="wrap room-top">
        <div className="room-title">
          <span className="em" aria-hidden="true">{jar.emoji}</span>
          <div style={{ minWidth: 0 }}>
            <h1>{jar.name}</h1>
            <span className="hint">
              <span aria-hidden="true" style={{ color: live ? "#3fcf8e" : "#c9a" }}>●</span> {live ? `${online} of ${players.length} here` : "Reconnecting…"}
              {jar.locked && " · 🔒 locked"}
            </span>
          </div>
        </div>
        <div className="ava-stack" aria-label={`${players.length} players`}>
          {players.slice(0, 6).map((p) => (
            <span key={p.id} className="ava ava--sm" style={{ background: p.color, opacity: p.online ? 1 : 0.45 }} title={p.name}>
              {p.avatar}
            </span>
          ))}
        </div>
        <button
          className="code-btn"
          onClick={async () => (await copyText(inviteLink(jar.code))) && toast("Invite link copied")}
          aria-label={`Jar code ${jar.code}. Copy invite link`}
        >
          <span className="code-chip">{jar.code}</span> 📋
        </button>
        <ThemeToggle />
        <button className="icon-btn" onClick={() => setMenu(true)} aria-label="Jar menu" title="Jar menu">
          {state.me.role === "host" ? "⚙️" : "☰"}
        </button>
      </header>

      <main className="wrap room-body" data-tab={tab} data-focus={bigScreen || !!draw}>
        <section className="stage" aria-label="The jar">
          <button
            className="stage-toggle"
            onClick={() => setBigScreen(!bigScreen)}
            aria-pressed={bigScreen}
            title={bigScreen ? "Show the side panel" : "Big screen: only the jar is shown"}
          >
            {bigScreen ? "⤡ Small" : "⤢ Big screen"}
          </button>
          {jar.ended ? (
            <Recap state={state} />
          ) : draw ? (
            <DrawStage
              key={draw.id}
              state={state}
              draw={draw}
              animate={animateId === draw.id}
              busy={busy}
              onResolve={resolve}
              onReact={react}
            />
          ) : (
            <>
              <div className="stage-jar">
                <Jar slips={state.slips} mood={shaking ? "shaking" : slipCount ? "happy" : "sleepy"} />
              </div>
              <div>
                <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2.1rem)" }}>
                  {slipCount ? `${slipCount} ${slipCount === 1 ? "slip" : "slips"} in the jar` : "The jar is empty"}
                </h2>
                <p style={{ opacity: 0.9, marginTop: 6 }}>
                  {slipCount
                    ? "Anyone can shake. The jar picks the dare and who does it."
                    : "Everyone drops a few dares in first. Nobody else can read them."}
                </p>
              </div>
              <div className="meta">
                {jar.anonymous && <span className="pill">🤫 Anonymous</span>}
                {players.length < 2 && <span className="pill">⏳ Waiting for friends</span>}
              </div>
              {slipCount ? (
                <button className="btn btn--big" onClick={doShake} disabled={shaking}>
                  {shaking ? "Shaking…" : "Shake the jar"}
                </button>
              ) : (
                <button className="btn btn--big" onClick={() => setTab("slips")}>Write a dare</button>
              )}
              {lastDone && (
                <p className="hint" style={{ color: "rgba(255,255,255,0.85)" }}>
                  Last up: {players.find((p) => p.id === lastDone.victimId)?.name ?? "someone"} ·{" "}
                  {{ done: "did it ✅", chicken: "chickened out 🐔", veto: "vetoed 🚫", redraw: "redrawn", pending: "" }[lastDone.outcome]}
                </p>
              )}
            </>
          )}
        </section>

        <div className="side-panel">
          <div className="tabbar" role="tablist" aria-label="Jar sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                className={t.id === "jar" ? "tab-jar" : undefined}
                aria-selected={tab === t.id}
                data-side={t.id === sideTab}
                onClick={() => setTab(t.id)}
              >
                <span aria-hidden="true">{t.icon}</span>
                <span className="tab-label">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="side-content">
            {sideTab === "slips" && <SlipsPanel state={state} toast={toast} hidden={slipsHidden} setHidden={setSlipsHidden} />}
            {sideTab === "scores" && <ScoresPanel state={state} />}
            {sideTab === "history" && <HistoryPanel state={state} toast={toast} />}
          </div>
        </div>
      </main>

      <div className="floaters" aria-hidden="true">
        {floaters.map((f) => (
          <span key={f.id} className="floater" style={{ left: `${f.left}%`, "--drift": `${f.drift}px` } as React.CSSProperties}>
            {f.emoji}
            <small>{f.name}</small>
          </span>
        ))}
      </div>

      {toastMsg && <div className="toast" role="status" data-kind={toastMsg.kind}>{toastMsg.text}</div>}
      {menu && <JarMenu state={state} onClose={() => setMenu(false)} toast={toast} />}
    </div>
  );
}
