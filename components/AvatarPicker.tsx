"use client";

import { AVATARS } from "@/lib/constants";

export function AvatarPicker({ value, onChange, taken = [] }: { value: string; onChange: (a: string) => void; taken?: string[] }) {
  return (
    <div className="avatars" role="group" aria-label="Pick an avatar">
      {AVATARS.map((a) => (
        <button
          key={a}
          type="button"
          aria-pressed={value === a}
          aria-label={`Avatar ${a}${taken.includes(a) ? " (someone has this one)" : ""}`}
          onClick={() => onChange(a)}
          style={taken.includes(a) && value !== a ? { opacity: 0.4 } : undefined}
        >
          {a}
        </button>
      ))}
    </div>
  );
}
