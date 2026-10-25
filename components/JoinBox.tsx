"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CodeInput } from "./CodeInput";
import { ApiError, api } from "@/lib/api";
import { LIMITS } from "@/lib/constants";

export function JoinBox() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);

  const go = async (c = code) => {
    if (c.length !== LIMITS.codeLength || busy) return;
    setBusy(true);
    setError("");
    try {
      const jar = await api<{ member: boolean; code: string }>("/api/jars/peek", { code: c });
      router.push(jar.member ? `/jar/${jar.code}` : `/j/${jar.code}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
      setShake(true);
      setTimeout(() => setShake(false), 450);
      setBusy(false);
    }
  };

  return (
    <form
      className="join-card"
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
    >
      <h2>Got a jar code?</h2>
      <CodeInput value={code} onChange={(v) => { setCode(v); setError(""); }} onComplete={go} shake={shake} />
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn btn--primary btn--block" disabled={code.length !== LIMITS.codeLength || busy}>
        {busy ? "Finding your jar…" : "Hop in →"}
      </button>
    </form>
  );
}
