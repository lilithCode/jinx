"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function current(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => setTheme(current()), []);

  const flip = () => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("dj-theme", next);
    } catch {}
    setTheme(next);
  };

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={flip}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Night mode"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}

/** Runs before paint so the saved theme doesn't flash. */
export const themeScript = `try{var t=localStorage.getItem("dj-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
