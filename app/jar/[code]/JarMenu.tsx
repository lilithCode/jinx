"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ApiError, api, copyText, inviteLink } from "@/lib/api";
import { PACKS } from "@/lib/packs";
import type { JarState } from "@/lib/types";

type Props = { state: JarState; onClose: () => void; toast: (m: string, kind?: "error") => void };

export function JarMenu({ state, onClose, toast }: Props) {
  const router = useRouter();
  const host = state.me.role === "host";
  const { jar } = state;
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sheet.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hostDo = async (body: Record<string, unknown>, done?: string) => {
    setBusy(true);
    try {
      const out = await api<Record<string, unknown>>(`/api/jar/${jar.code}/host`, body);
      if (done) toast(done);
      if (out.deleted) router.replace("/");
      if (typeof out.code === "string") router.replace(`/jar/${out.code}`);
      return out;
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "That didn't work.", "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const leave = async () => {
    try {
      await api(`/api/jar/${jar.code}/leave`);
      router.replace("/");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "That didn't work.", "error");
    }
  };


  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-title"
        tabIndex={-1}
        ref={sheet}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-head">
          <h2 id="menu-title" style={{ fontSize: "1.4rem" }}>{jar.emoji} {jar.name}</h2>
          <div className="btn-row" style={{ flexWrap: "nowrap" }}>
            <Link href="/" className="btn btn--ghost btn--sm">🏠 Home</Link>
            <button className="icon-btn" onClick={onClose} aria-label="Close menu">✕</button>
          </div>
        </div>

        <div className="sheet-section" style={{ borderTop: 0, paddingTop: 0 }}>
          <h3>Invite friends</h3>
          <p className="hint">
            Code <b className="code-chip">{jar.code}</b>
            {jar.hasPassword && " · password protected"}
            {jar.locked && " · locked"}
          </p>
          <div className="btn-row">
            <button className="btn btn--ghost btn--sm" onClick={async () => (await copyText(jar.code)) && toast("Code copied")}>Copy code</button>
            <button className="btn btn--ghost btn--sm" onClick={async () => (await copyText(inviteLink(jar.code))) && toast("Invite link copied")}>Copy invite link</button>
          </div>
        </div>

        {host && (
          <>
            <div className="sheet-section">
              <h3>Who can get in</h3>
              <div className="btn-row">
                <button className="btn btn--ghost btn--sm" disabled={busy} onClick={() => hostDo({ action: jar.locked ? "unlock" : "lock" }, jar.locked ? "Jar unlocked" : "Jar locked")}>
                  {jar.locked ? "🔓 Unlock jar" : "🔒 Lock jar"}
                </button>
                <button className="btn btn--ghost btn--sm" disabled={busy} onClick={() => hostDo({ action: "newCode" }, "New code made. The old one stopped working.")}>
                  🔁 Make a new code
                </button>
              </div>
              <p className="hint">Locking stops new people from joining. A new code kills the old one; players already inside stay.</p>
            </div>

            <div className="sheet-section">
              <h3>Players</h3>
              <ul className="player-list">
                {state.players.map((p) => (
                  <li key={p.id} className="player-row">
                    <span className="ava ava--sm" style={{ background: p.color }}>{p.avatar}</span>
                    <span>{p.name}{p.role === "host" ? " 👑" : ""}</span>
                    {p.id !== state.me.id &&
                      (confirm === `rm:${p.id}` ? (
                        <button className="btn btn--primary btn--sm" disabled={busy} onClick={() => hostDo({ action: "remove", playerId: p.id }, `${p.name} was removed`)}>
                          Remove {p.name}?
                        </button>
                      ) : (
                        <button className="btn btn--ghost btn--sm" onClick={() => setConfirm(`rm:${p.id}`)}>Remove</button>
                      ))}
                  </li>
                ))}
              </ul>
              <p className="hint">Removing someone frees their seat and takes their unread slips out of the jar.</p>
            </div>

            <div className="sheet-section">
              <h3>Rules</h3>
              <label className="check">
                <input type="checkbox" checked={jar.noOwnDares} disabled={busy} onChange={(e) => hostDo({ action: "rules", noOwnDares: e.target.checked, anonymous: jar.anonymous })} />
                <span><b>Never draw your own slip</b></span>
              </label>
              <label className="check">
                <input type="checkbox" checked={jar.anonymous} disabled={busy} onChange={(e) => hostDo({ action: "rules", anonymous: e.target.checked, noOwnDares: jar.noOwnDares })} />
                <span><b>Anonymous mode</b><small>Hide who wrote each dare.</small></span>
              </label>
            </div>

            {!jar.ended && (
              <div className="sheet-section">
                <h3>Starter packs</h3>
                <p className="hint">Tip a ready-made set of sealed slips into the jar.</p>
                <div className="btn-row">
                  {PACKS.map((p) => (
                    <button key={p.id} className="btn btn--ghost btn--sm" disabled={busy} onClick={async () => {
                      const out = await hostDo({ action: "pack", packId: p.id });
                      if (out) toast(`Added ${out.added} slips from ${p.name}`);
                    }}>
                      {p.icon} {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="sheet-section">
              <h3>Game</h3>
              <div className="btn-row">
                {jar.ended ? (
                  <button className="btn btn--ghost btn--sm" disabled={busy} onClick={() => hostDo({ action: "reopen" }, "Game reopened")}>▶️ Reopen game</button>
                ) : confirm === "end" ? (
                  <button className="btn btn--plum btn--sm" disabled={busy} onClick={() => hostDo({ action: "end" }, "Game over!").then(onClose)}>Yes, end it</button>
                ) : (
                  <button className="btn btn--ghost btn--sm" onClick={() => setConfirm("end")}>🏁 End game</button>
                )}
                {confirm === "delete" ? (
                  <button className="btn btn--primary btn--sm" disabled={busy} onClick={() => hostDo({ action: "delete" })}>Delete forever</button>
                ) : (
                  <button className="btn btn--ghost btn--sm" onClick={() => setConfirm("delete")}>🧽 Delete jar now</button>
                )}
              </div>
              <p className="hint">Deleting wipes every slip and score right away. It can&rsquo;t be undone.</p>
            </div>
          </>
        )}

        {!host && (
          <div className="sheet-section">
            {confirm === "leave" ? (
              <button className="btn btn--primary" onClick={leave}>Leave and take my unread slips</button>
            ) : (
              <button className="btn btn--ghost" onClick={() => setConfirm("leave")}>🚪 Leave this jar</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
