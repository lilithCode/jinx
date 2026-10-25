"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { JarState } from "@/lib/types";

type Handlers = {
  onDraw?: (drawId: string) => void;
  onReaction?: (emoji: string, playerId: string) => void;
};

const POLL_MS = 1500;
const HIDDEN_POLL_MS = 8000;
const HEARTBEAT_MS = 10_000; // full refetch, also marks us "here"
const FRESH_DRAW_MS = 8000; // draws younger than this play the animation

/** Loads this viewer's filtered jar state and keeps it fresh by polling a tiny change counter. */
export function useJar(code: string, handlers: Handlers) {
  const router = useRouter();
  const [state, setState] = useState<JarState | null>(null);
  const [gone, setGone] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const h = useRef(handlers);
  h.current = handlers;
  const inflight = useRef<Promise<void> | null>(null);
  const again = useRef(false);
  const lastDraw = useRef<string | null | undefined>(undefined);
  const known = useRef({ jarId: "", v: -1, rx: -1, fetchedAt: 0 });

  const refetch = useCallback(async (): Promise<void> => {
    // Coalesce bursts into at most one extra request.
    if (inflight.current) {
      again.current = true;
      return inflight.current;
    }
    inflight.current = (async () => {
      try {
        const res = await fetch(`/api/jar/${code}/state`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (res.status === 409 && data.movedTo) {
          router.replace(`/jar/${data.movedTo}`);
          return;
        }
        if (res.status === 403) {
          if (data.removed) setGone("The host removed you from this jar.");
          else router.replace(`/j/${code}`);
          return;
        }
        if (res.status === 404) {
          setGone("This jar doesn't exist anymore. It may have expired or the host deleted it.");
          return;
        }
        if (!res.ok) return;
        const s = data as JarState;
        known.current = { ...known.current, jarId: s.jar.id, v: s.version, fetchedAt: Date.now() };
        // A draw we haven't seen yet that just happened gets the full animation on every screen.
        const drawId = s.draw?.id ?? null;
        if (drawId && drawId !== lastDraw.current && s.now - (s.draw?.createdAt ?? 0) < FRESH_DRAW_MS) {
          h.current.onDraw?.(drawId);
        }
        lastDraw.current = drawId;
        setState(s);
        setLive(true);
      } catch {
        setLive(false);
      } finally {
        inflight.current = null;
        if (again.current) {
          again.current = false;
          void refetch();
        }
      }
    })();
    return inflight.current;
  }, [code, router]);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      const k = known.current;
      try {
        if (!k.jarId) {
          await refetch();
        } else {
          const res = await fetch(`/api/live/${k.jarId}?rx=${Math.max(0, k.rx)}`, { cache: "no-store" });
          if (res.ok) {
            const d = (await res.json()) as { v: number; rx: number; reactions: { emoji: string; playerId: string }[] };
            // Skip reactions that happened before we arrived.
            if (k.rx >= 0) d.reactions.forEach((r) => h.current.onReaction?.(r.emoji, r.playerId));
            known.current.rx = d.rx;
            setLive(true);
            if (d.v !== k.v || Date.now() - k.fetchedAt > HEARTBEAT_MS) await refetch();
          } else setLive(false);
        }
      } catch {
        setLive(false);
      }
      if (!stopped) timer = setTimeout(tick, document.hidden ? HIDDEN_POLL_MS : POLL_MS);
    };

    const wake = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        void tick();
      }
    };

    const changed = () => void refetch();

    void tick();
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("jinx:changed", changed);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("jinx:changed", changed);
    };
  }, [refetch]);

  return { state, gone, live, refetch };
}
