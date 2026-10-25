"use client";

import Link from "next/link";
import { useState } from "react";
import { AvatarPicker } from "@/components/AvatarPicker";
import { ApiError, api, copyText, inviteLink } from "@/lib/api";
import { AVATARS, JAR_EMOJIS, LIMITS } from "@/lib/constants";

const STEPS = ["Your jar", "Players", "Rules"] as const;

export function CreateWizard() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string>(JAR_EMOJIS[0]);
  const [players, setPlayers] = useState(4);
  const [hostName, setHostName] = useState("");
  const [avatar, setAvatar] = useState<string>(AVATARS[0]);
  const [anonymous, setAnonymous] = useState(false);
  const [noOwnDares, setNoOwnDares] = useState(true);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState<"" | "code" | "link">("");

  const canNext =
    step === 0 ? name.trim().length > 0 : step === 1 ? hostName.trim().length > 0 : true;

  const create = async () => {
    setBusy(true);
    setError("");
    try {
      const out = await api<{ code: string }>("/api/jars", {
        name, emoji, maxPlayers: players, hostName, avatar, anonymous, noOwnDares,
        password: usePassword ? password : "",
      });
      setCode(out.code);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (what: "code" | "link") => {
    if (!code) return;
    if (await copyText(what === "code" ? code : inviteLink(code))) {
      setCopied(what);
      setTimeout(() => setCopied(""), 1600);
    }
  };

  if (code) {
    const canShare = typeof navigator !== "undefined" && "share" in navigator;
    return (
      <section className="flow-card" aria-labelledby="done-title">
        <div>
          <p className="eyebrow">Jar ready {emoji}</p>
          <h1 id="done-title">Send this code to your friends</h1>
        </div>
        <div className="code-reveal" aria-label={`Jar code ${code.split("").join(" ")}`}>
          {code.split("").map((c, i) => <span key={i}>{c}</span>)}
        </div>
        <p className="hint">
          They can type it on the Jinx home page, or open the invite link to skip straight in.
          {usePassword && " They'll also need the jar password you set."}
        </p>
        <div className="share-row">
          <button className="btn btn--ghost" onClick={() => copy("code")}>{copied === "code" ? "Copied ✓" : "Copy code"}</button>
          <button className="btn btn--ghost" onClick={() => copy("link")}>{copied === "link" ? "Copied ✓" : "Copy invite link"}</button>
          {canShare && (
            <button
              className="btn btn--ghost"
              onClick={() => navigator.share({ title: `Join ${name} on Jinx`, text: `Jar code: ${code}`, url: inviteLink(code) }).catch(() => {})}
            >
              Share…
            </button>
          )}
        </div>
        <Link href={`/jar/${code}`} className="btn btn--primary btn--big btn--block">Open my jar →</Link>
      </section>
    );
  }

  return (
    <form
      className="flow-card"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canNext || busy) return;
        if (step < STEPS.length - 1) setStep(step + 1);
        else create();
      }}
    >
      <div className="progress" aria-hidden="true">
        {STEPS.map((s, i) => <span key={s} data-on={i <= step} />)}
      </div>
      <div>
        <p className="eyebrow">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
        <h1>{["Name your jar", "Who's playing?", "Set the rules"][step]}</h1>
      </div>

      {step === 0 && (
        <>
          <label className="field">
            <span>Jar name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={LIMITS.jarNameMax}
              placeholder="Saturday sleepover"
              autoFocus
            />
          </label>
          <div className="field">
            <span>Jar sticker</span>
            <div className="avatars" role="group" aria-label="Jar sticker">
              {JAR_EMOJIS.map((e) => (
                <button key={e} type="button" aria-pressed={emoji === e} onClick={() => setEmoji(e)}>{e}</button>
              ))}
            </div>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <div className="field">
            <span id="players-label">Number of players (including you)</span>
            <div className="stepper" role="group" aria-labelledby="players-label">
              <button type="button" className="icon-btn" aria-label="One fewer player" onClick={() => setPlayers(Math.max(LIMITS.minPlayers, players - 1))}>−</button>
              <output aria-live="polite">{players}</output>
              <button type="button" className="icon-btn" aria-label="One more player" onClick={() => setPlayers(Math.min(LIMITS.maxPlayers, players + 1))}>+</button>
            </div>
            <input
              type="range"
              className="range"
              min={LIMITS.minPlayers}
              max={LIMITS.maxPlayers}
              value={players}
              onChange={(e) => setPlayers(Number(e.target.value))}
              aria-label="Number of players"
            />
            <p className="hint">Up to {LIMITS.maxPlayers} players. The jar locks itself once every seat is taken.</p>
          </div>
          <label className="field">
            <span>Your name</span>
            <input
              className="input"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              maxLength={LIMITS.nameMax}
              placeholder="What your friends call you"
              autoFocus
            />
          </label>
          <div className="field">
            <span>Your avatar</span>
            <AvatarPicker value={avatar} onChange={setAvatar} />
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <label className="check">
            <input type="checkbox" checked={noOwnDares} onChange={(e) => setNoOwnDares(e.target.checked)} />
            <span><b>Never draw your own slip</b><small>The jar won&rsquo;t hand you a dare you wrote.</small></span>
          </label>
          <label className="check">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
            <span><b>Anonymous mode</b><small>Hide who wrote each dare, even after it&rsquo;s drawn.</small></span>
          </label>
          <label className="check">
            <input type="checkbox" checked={usePassword} onChange={(e) => setUsePassword(e.target.checked)} />
            <span><b>Add a jar password</b><small>Friends need the code <em>and</em> the password to get in.</small></span>
          </label>
          {usePassword && (
            <label className="field">
              <span>Jar password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={LIMITS.passwordMax}
                autoComplete="new-password"
              />
            </label>
          )}
        </>
      )}

      {error && <p className="error" role="alert">{error}</p>}

      <div className="flow-actions">
        {step > 0 ? (
          <button type="button" className="btn btn--ghost" onClick={() => setStep(step - 1)}>← Back</button>
        ) : (
          <Link href="/" className="btn btn--ghost">Cancel</Link>
        )}
        <button
          className="btn btn--primary"
          disabled={!canNext || busy || (step === 2 && usePassword && password.length < 4)}
        >
          {step < STEPS.length - 1 ? "Next →" : busy ? "Filling…" : "Create jar 🎉"}
        </button>
      </div>
    </form>
  );
}
