import Link from "next/link";
import { Jar } from "@/components/Jar";
import { JoinBox } from "@/components/JoinBox";
import { SiteHeader } from "@/components/SiteHeader";
import { LIMITS, PLAYER_COLORS } from "@/lib/constants";

const demoSlips = Array.from({ length: 26 }, (_, i) => ({
  id: `demo${i}`,
  color: PLAYER_COLORS[(i * 5) % 6],
}));

const STARS = [
  { top: "12%", left: "6%", size: 18, delay: "0s" },
  { top: "70%", left: "48%", size: 12, delay: "1.2s" },
  { top: "18%", left: "56%", size: 14, delay: "0.6s" },
  { top: "84%", left: "9%", size: 10, delay: "2s" },
  { top: "8%", left: "88%", size: 16, delay: "1.6s" },
];

const CALL_TIPS = [
  { icon: "🙈", title: "Slips stay hidden", text: "Your own slips are covered until you choose to peek, so sharing your screen on a call gives nothing away.", tilt: "-3deg", paper: "var(--slip-a)" },
  { icon: "⤢", title: "Big-screen jar", text: "When the jar is shaken, the draw fills the screen for everyone watching.", tilt: "2deg", paper: "var(--slip-b)" },
  { icon: "✏️", title: "Fix the record", text: "Chickened out, then did it anyway? The host or that player can change the result later.", tilt: "-1.5deg", paper: "var(--slip-c)" },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="wrap hero-grid" aria-label="Start playing">
          <div className="hero">
            <div className="stars" aria-hidden="true">
              {STARS.map((s, i) => (
                <span key={i} style={{ top: s.top, left: s.left, fontSize: s.size, animationDelay: s.delay }}>✦</span>
              ))}
            </div>
            <div>
              <p className="eyebrow">A party game for friends who can&rsquo;t say no</p>
              <h1>Drop a dare.<br />Shake the jar.</h1>
              <p className="hero-lead">
                Everyone slips secret dares into one shared jar. The jar picks the dare <em>and</em> who has to do it.
              </p>
              <JoinBox />
            </div>
            <div className="hero-jar">
              <Jar slips={demoSlips} title="Jarbo the dare jar" />
            </div>
          </div>

          <aside className="create-card" aria-labelledby="create-title">
            <svg className="slip-deco" width="120" height="70" viewBox="0 0 120 70" aria-hidden="true">
              <rect x="4" y="8" width="108" height="56" rx="8" fill="#fff8ee" stroke="#5b2a5e" strokeWidth="4" />
              <path d="M18 28 H90 M18 44 H70" stroke="#f07a9a" strokeWidth="5" strokeLinecap="round" />
            </svg>
            <span className="plus" aria-hidden="true">+</span>
            <div>
              <h2 id="create-title">Fill a new jar</h2>
              <p>Start a game, then send the code to your friends.</p>
            </div>
            <ul>
              <li>👯 2 to {LIMITS.maxPlayers} players</li>
              <li>🔒 Slips stay sealed until drawn</li>
              <li>🗝️ Stays until you delete it</li>
            </ul>
            <Link href="/new" className="btn btn--plum btn--block">Create a jar</Link>
          </aside>
        </section>

        <section id="how" className="section wrap" aria-labelledby="how-title">
          <div className="section-head">
            <p className="eyebrow">How it works</p>
            <h2 id="how-title">Three steps from &ldquo;I&rsquo;m bored&rdquo; to &ldquo;I can&rsquo;t believe you did that.&rdquo;</h2>
          </div>
          <ol className="steps">
            <li className="step">
              <span className="num">1</span>
              <h3>Fill a jar</h3>
              <p>Name it, choose how many friends are playing, and send them the six-letter code.</p>
              <span className="art" aria-hidden="true">🫙</span>
            </li>
            <li className="step">
              <span className="num">2</span>
              <h3>Drop secret slips</h3>
              <p>Everyone writes dares from their own phone. You only see your own until the jar picks one.</p>
              <span className="art" aria-hidden="true">✍️</span>
            </li>
            <li className="step">
              <span className="num">3</span>
              <h3>Shake it</h3>
              <p>The jar rattles on every screen, picks a victim and a dare. Do it, chicken out, or veto it.</p>
              <span className="art" aria-hidden="true">🎲</span>
            </li>
          </ol>
        </section>

        <section className="section wrap" aria-labelledby="call-title" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <p className="eyebrow">Made for video calls</p>
            <h2 id="call-title">Share your screen without spoiling the jar.</h2>
          </div>
          <div className="spice-row">
            {CALL_TIPS.map((t) => (
              <article key={t.title} className="slip" style={{ "--tilt": t.tilt, "--slip": t.paper } as React.CSSProperties}>
                <h3>{t.icon} {t.title}</h3>
                <p>{t.text}</p>
              </article>
            ))}
          </div>
        </section>

        <svg className="wave" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true" style={{ color: "var(--night)", marginBottom: -1 }}>
          <path d="M0 40 C 240 0, 480 70, 720 36 S 1200 0, 1440 34 V70 H0 Z" fill="currentColor" />
        </svg>
        <section className="night" aria-labelledby="sealed-title">
          <div className="wrap section night-grid">
            <div className="section-head" style={{ marginBottom: 0 }}>
              <p className="eyebrow">Sealed until shaken</p>
              <h2 id="sealed-title">Nobody peeks. Not even the host.</h2>
              <p className="muted">
                Your slips are folded the moment you drop them. The server picks the dare, so nobody can read
                the jar early or rig the draw from their phone.
              </p>
            </div>
            <ul className="promise-list">
              <li>
                <span className="ic">🔐</span>
                <div><b>Six-letter codes, guess-proof</b><p className="muted">Wrong guesses get slowed down fast. Hosts can lock the jar or swap the code anytime.</p></div>
              </li>
              <li>
                <span className="ic">🙈</span>
                <div><b>No accounts, no emails</b><p className="muted">Just a nickname. Your seat is remembered on your device.</p></div>
              </li>
              <li>
                <span className="ic">🗝️</span>
                <div><b>Your jar, your call</b><p className="muted">Jars and scores stay until the host deletes them. Nothing disappears on its own.</p></div>
              </li>
              <li>
                <span className="ic">🚫</span>
                <div><b>Veto anything</b><p className="muted">Two players (or the host) can toss a slip out for good. Fun stops at uncomfortable.</p></div>
              </li>
            </ul>
          </div>
          <div className="wrap footer-cta">
            <h2>Your friends are waiting.</h2>
            <Link href="/new" className="btn btn--primary btn--big">Fill a jar</Link>
          </div>
          <footer className="wrap site-footer">
            <span>Jinx · made for friends</span>
            <Link href="/rules">House rules &amp; privacy</Link>
          </footer>
        </section>
      </main>
    </>
  );
}
