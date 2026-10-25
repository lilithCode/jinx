"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AvatarPicker } from "@/components/AvatarPicker";
import { CodeInput } from "@/components/CodeInput";
import { ApiError, api } from "@/lib/api";
import { AVATARS, LIMITS, normalizeCode } from "@/lib/constants";
import type { JarPeek } from "@/lib/types";

export function JoinFlow({ code: rawCode }: { code: string }) {
  const router = useRouter();
  const [code, setCode] = useState(normalizeCode(rawCode));
  const [jar, setJar] = useState<JarPeek | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string>(AVATARS[0]);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const peek = async (c: string) => {
    setLoading(true);
    setError("");
    try {
      const j = await api<JarPeek>("/api/jars/peek", { code: c });
      if (j.member) {
        router.replace(`/jar/${j.code}`);
        return;
      }
      setJar(j);
      setAvatar(AVATARS.find((a) => !j.takenAvatars.includes(a)) ?? AVATARS[0]);
    } catch (e) {
      setJar(null);
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code.length === LIMITS.codeLength) peek(code);
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const join = async () => {
    if (!jar) return;
    setBusy(true);
    setError("");
    try {
      const out = await api<{ code: string }>("/api/jars/join", { code: jar.code, name, avatar, password });
      router.replace(`/jar/${out.code}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
      setBusy(false);
    }
  };

  if (loading) {
    return <section className="flow-card"><p className="muted">Looking for jar {code}…</p></section>;
  }

  if (!jar) {
    return (
      <form
        className="flow-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length === LIMITS.codeLength) peek(code);
        }}
      >
        <div>
          <p className="eyebrow">Enter a jar</p>
          <h1>Type the jar code</h1>
        </div>
        <CodeInput value={code} onChange={setCode} onComplete={peek} autoFocus />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn--primary btn--block" disabled={code.length !== LIMITS.codeLength}>Find jar</button>
      </form>
    );
  }

  const full = jar.taken >= jar.maxPlayers;
  const blocked = jar.ended ? "This game has already ended." : jar.locked ? "The host has locked this jar." : full ? "Every seat in this jar is taken." : "";

  return (
    <form
      className="flow-card"
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy && !blocked) join();
      }}
    >
      <div>
        <p className="eyebrow">You&rsquo;re invited</p>
        <h1>Grab a seat</h1>
      </div>
      <div className="jar-peek">
        <span className="em" aria-hidden="true">{jar.emoji}</span>
        <div>
          <b>{jar.name}</b>
          <p className="hint">
            {jar.taken} of {jar.maxPlayers} seats taken
          </p>
        </div>
      </div>

      {blocked ? (
        <>
          <p className="error" role="alert">{blocked} Ask the host to {jar.ended ? "start a new jar" : "make room"}.</p>
          <Link href="/" className="btn btn--ghost">Back home</Link>
        </>
      ) : (
        <>
          <label className="field">
            <span>Your name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={LIMITS.nameMax}
              placeholder="What your friends call you"
              autoFocus
            />
          </label>
          <div className="field">
            <span>Your avatar</span>
            <AvatarPicker value={avatar} onChange={setAvatar} taken={jar.takenAvatars} />
          </div>
          {jar.needsPassword && (
            <label className="field">
              <span>Jar password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={LIMITS.passwordMax}
                autoComplete="off"
              />
            </label>
          )}
          {error && <p className="error" role="alert">{error}</p>}
          <button
            className="btn btn--primary btn--big btn--block"
            disabled={busy || !name.trim() || (jar.needsPassword && !password)}
          >
            {busy ? "Joining…" : "Join the jar"}
          </button>
        </>
      )}
    </form>
  );
}
