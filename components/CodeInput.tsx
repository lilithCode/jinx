"use client";

import { useRef } from "react";
import { LIMITS, normalizeCode } from "@/lib/constants";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  shake?: boolean;
  autoFocus?: boolean;
  label?: string;
};

/** Six letter boxes. Typing auto-advances, backspace walks back, pasting fills them all. */
export function CodeInput({ value, onChange, onComplete, shake, autoFocus, label = "Jar code" }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({ length: LIMITS.codeLength }, (_, i) => value[i] ?? "");

  const set = (next: string, focusAt?: number) => {
    const clean = normalizeCode(next);
    onChange(clean);
    if (focusAt !== undefined) refs.current[Math.min(focusAt, LIMITS.codeLength - 1)]?.focus();
    if (clean.length === LIMITS.codeLength) onComplete?.(clean);
  };

  return (
    <div className="code-boxes" role="group" aria-label={label} data-shake={shake ? "true" : "false"}>
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={c}
          data-filled={c ? "true" : "false"}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus && i === 0}
          aria-label={`${label} character ${i + 1}`}
          maxLength={LIMITS.codeLength}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const typed = normalizeCode(e.target.value);
            if (!typed) return;
            if (typed.length > 1) {
              // paste or autofill into one box
              set(value.slice(0, i) + typed, i + typed.length);
              return;
            }
            const arr = chars.slice();
            arr[i] = typed;
            set(arr.join(""), i + 1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              const arr = chars.slice();
              if (arr[i]) {
                arr[i] = "";
                set(arr.join("").slice(0, i) + arr.slice(i + 1).join(""), i);
              } else if (i > 0) {
                arr[i - 1] = "";
                set(arr.join(""), i - 1);
              }
            } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            else if (e.key === "ArrowRight" && i < LIMITS.codeLength - 1) refs.current[i + 1]?.focus();
          }}
          onPaste={(e) => {
            e.preventDefault();
            set(e.clipboardData.getData("text"), LIMITS.codeLength - 1);
          }}
        />
      ))}
    </div>
  );
}
