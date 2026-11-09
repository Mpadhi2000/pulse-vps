import type { Scalar } from "./types";

export const num = (v: unknown): number | null => {
  const n = parseFloat(String(v ?? "").replace(/[^\d.\-]/g, ""));
  return Number.isNaN(n) ? null : n;
};

export const has = (v: unknown): boolean =>
  v !== undefined && v !== null && String(v).trim() !== "";

export const fmtPct = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(1));

export function relTime(date: Date | null): string | null {
  if (!date || Number.isNaN(date.getTime())) return null;
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  if (s < 0) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60}m ago`;
  return `${Math.floor(h / 24)}d ${h % 24}h ago`;
}

/** Accepts "2026-11-08_2219IST", "2026-11-08 22:19:00" or any ISO string. */
export function parseBackupTs(s: Scalar): Date | null {
  if (!has(s)) return null;
  const m = String(s).match(/^(\d{4}-\d{2}-\d{2})[_ T](\d{2}):?(\d{2})(?::?(\d{2}))?\s*(IST)?/i);
  if (m) {
    const tz = m[5] ? "+05:30" : "";
    const d = new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4] || "00"}${tz}`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(s));
  return Number.isNaN(d.getTime()) ? null : d;
}

export const fmtDate = (d: Date) =>
  d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

export const prettyUptime = (s?: string) => String(s || "—").replace(/^up\s+/i, "");

/** "30G" -> "30 GB" */
export const withUnit = (v: Scalar) => String(v ?? "").replace(/^([\d.]+)\s*([KMGT])$/i, "$1 $2B");

export function containerState(statusRaw?: string, healthRaw?: string) {
  const s = String(statusRaw || "").toLowerCase();
  const h = String(healthRaw || "").toLowerCase();
  const up = s.startsWith("up") || s === "running";
  let health: string | null = null;
  if (h) health = h;
  else if (s.includes("(unhealthy)")) health = "unhealthy";
  else if (s.includes("(healthy)")) health = "healthy";
  else if (s.includes("health: starting")) health = "starting";
  const uptime = String(statusRaw || "")
    .replace(/\s*\((un)?healthy\)|\s*\(health: starting\)/i, "")
    .trim();
  return { up, health, uptime };
}

export const barLevel = (p: number) => (p >= 90 ? "crit" : p >= 70 ? "warn" : "");
