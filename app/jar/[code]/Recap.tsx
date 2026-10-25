import type { JarState, PlayerView } from "@/lib/types";

export function Recap({ state }: { state: JarState }) {
  const count = (outcome: string) => {
    const m = new Map<string, number>();
    for (const h of state.history) if (h.outcome === outcome && h.victimId) m.set(h.victimId, (m.get(h.victimId) ?? 0) + 1);
    return m;
  };
  const done = count("done");
  const chickens = count("chicken");
  const top = (m: Map<string, number>) => {
    let best: [PlayerView, number] | null = null;
    for (const p of state.players) {
      const n = m.get(p.id) ?? 0;
      if (n > 0 && (!best || n > best[1])) best = [p, n];
    }
    return best;
  };
  const bravest = [...state.players].sort((a, b) => b.score - a.score)[0];
  const mostDone = top(done);
  const chicken = top(chickens);
  const total = [...done.values()].reduce((a, b) => a + b, 0);

  return (
    <div className="recap">
      <p className="eyebrow" style={{ color: "#fff" }}>Game over</p>
      <h2 style={{ fontSize: "clamp(1.8rem, 5vw, 2.6rem)" }}>{total} {total === 1 ? "dare" : "dares"} done. Legends.</h2>
      {bravest && bravest.score > 0 && (
        <div className="award">
          <span className="medal">🏆</span>
          <div><b>Bravest: {bravest.avatar} {bravest.name}</b><p>{bravest.score} points</p></div>
        </div>
      )}
      {mostDone && (
        <div className="award">
          <span className="medal">💪</span>
          <div><b>Most dares done: {mostDone[0].avatar} {mostDone[0].name}</b><p>{mostDone[1]} completed</p></div>
        </div>
      )}
      {chicken && (
        <div className="award">
          <span className="medal">🐔</span>
          <div><b>Biggest chicken: {chicken[0].avatar} {chicken[0].name}</b><p>Dodged {chicken[1]} {chicken[1] === 1 ? "dare" : "dares"}</p></div>
        </div>
      )}
      <p style={{ opacity: 0.9 }}>
        {state.me.role === "host" ? "Open the jar menu to reopen the game or delete the jar." : "Thanks for playing!"}
      </p>
    </div>
  );
}
