import type { PulseStatus } from "./types";

/** Parse the API's string scalars ("11.5", "30G", "8") into numbers. */
export const num = (v: unknown): number | null => {
  const n = parseFloat(String(v ?? "").replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

export const has = (v: unknown): boolean => v !== undefined && v !== null && String(v).trim() !== "";

export const fmtPct = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function relTime(date: Date | null): string | null {
  if (!date || Number.isNaN(date.getTime())) return null;
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60}m ago`;
  return `${Math.floor(h / 24)}d ${h % 24}h ago`;
}

/** Accepts "2026-11-08_2219IST", "2026-11-08 22:19:00" or any ISO string. */
export function parseBackupTs(s: string | undefined): Date | null {
  if (!has(s)) return null;
  const m = String(s).match(/^(\d{4}-\d{2}-\d{2})[_ T](\d{2}):?(\d{2})(?::?(\d{2}))?\s*(IST)?/i);
  const d = m
    ? new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4] || "00"}${m[5] ? "+05:30" : ""}`)
    : new Date(String(s));
  return Number.isNaN(d.getTime()) ? null : d;
}

// All times are shown in 12-hour format, e.g. "8:38:31 PM", "09 Nov, 8:38 PM".
const LOCALE = "en-US";

export const fmtTime = (d: Date | number, withSeconds = true) =>
  new Date(d).toLocaleTimeString(LOCALE, {
    hour: "numeric", minute: "2-digit", ...(withSeconds ? { second: "2-digit" } : {}), hour12: true,
  });

export const fmtDate = (d: Date | number, withSeconds = false) => {
  const date = new Date(d);
  const day = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  return `${day}, ${fmtTime(date, withSeconds)}`;
};

/**
 * Re-format an API timestamp like "2026-11-09 20:38:31" to "09 Nov, 8:38:31 PM"
 * without converting time zones (the value stays in the server's local time).
 */
export function fmtServerTs(s: string | undefined): string {
  if (!has(s)) return "—";
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return String(s);
  const [, , mo, dd, hh, mi, ss] = m;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const h = Number(hh);
  const h12 = h % 12 || 12;
  return `${dd} ${months[Number(mo) - 1] ?? mo}, ${h12}:${mi}${ss ? `:${ss}` : ""} ${h < 12 ? "AM" : "PM"}`;
}

/** Chart axis label. */
export const fmtClock = (t: number, withSeconds = false) => fmtTime(t, withSeconds);

export const prettyUptime = (s?: string) => String(s || "—").replace(/^up\s+/i, "");

/** "30G" -> "30 GB" */
export const withUnit = (v: unknown) => String(v ?? "").replace(/^([\d.]+)\s*([KMGT])$/i, "$1 $2B");

export function containerState(statusRaw?: string, healthRaw?: string) {
  const s = String(statusRaw || "").toLowerCase();
  const h = String(healthRaw || "").toLowerCase();
  const up = s.startsWith("up") || s === "running";
  let health: string | null = null;
  if (h) health = h;
  else if (s.includes("(unhealthy)")) health = "unhealthy";
  else if (s.includes("(healthy)")) health = "healthy";
  else if (s.includes("health: starting")) health = "starting";
  const uptime = String(statusRaw || "").replace(/\s*\((un)?healthy\)|\s*\(health: starting\)/i, "").trim();
  return { up, health, uptime };
}

export type Level = "ok" | "warn" | "crit";
export const usageLevel = (p: number | null): Level => (p === null ? "ok" : p >= 90 ? "crit" : p >= 70 ? "warn" : "ok");

export const servicesFailed = (fs: string | undefined) =>
  has(fs) && !/^(none|0|ok|\[\])$/i.test(String(fs).trim());

export const failedServiceList = (fs: string | undefined) =>
  servicesFailed(fs) ? String(fs).split(/[,\n]+/).map((s) => s.trim()).filter(Boolean) : [];

/** Degraded per API contract: failed services, error alerts, nginx down, or stopped containers. */
export function degradedReasons(d: PulseStatus): string[] {
  const out: string[] = [];
  if (servicesFailed(d.failed_services)) out.push("failed systemd services");
  if ((d.alerts ?? []).some((a) => String(a.level).toLowerCase() === "error")) out.push("error alerts");
  const ngx = String(d.nginx || "").toLowerCase();
  if (has(ngx) && ngx !== "active" && ngx !== "running") out.push("nginx down");
  const run = num(d.running_count), tot = num(d.total_count);
  if (run !== null && tot !== null && run < tot) out.push(`${tot - run} container${tot - run > 1 ? "s" : ""} stopped`);
  return out;
}
