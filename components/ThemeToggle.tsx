"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icons";

type Theme = "system" | "light" | "dark";
const ORDER: Theme[] = ["system", "light", "dark"];
const KEY = "pulse:theme";

/** Inline script for <head>: applies the saved theme before paint (no flash). */
export const themeScript = `try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      const t = localStorage.getItem(KEY);
      if (t === "light" || t === "dark") setTheme(t);
    } catch { /* ignore */ }
  }, []);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    const root = document.documentElement;
    if (next === "system") delete root.dataset.theme;
    else root.dataset.theme = next;
    try {
      if (next === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch { /* ignore */ }
  };

  const icon = theme === "light" ? "sun" : theme === "dark" ? "moon" : "monitor";
  return (
    <button type="button" className="btn-icon" onClick={cycle} aria-label={`Theme: ${theme}. Click to change.`} title={`Theme: ${theme}`}>
      <Icon name={icon} />
    </button>
  );
}
