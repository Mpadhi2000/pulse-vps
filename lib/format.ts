import type { Metrics, PulseStatus } from "./types";

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

/** Accepts ISO 8601 with zone, "2026-11-08_2219IST", "2026-11-08 22:19:00" or any Date-parsable string. */
export function parseBackupTs(s: string | undefined): Date | null {
  if (!has(s)) return null;
  // ISO 8601 with an explicit zone (API v2, e.g. "2026-11-09T11:37:53Z") — parse as-is.
  if (/T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/i.test(String(s).trim())) {
    const iso = new Date(String(s).trim());
    return Number.isNaN(iso.getTime()) ? null : iso;
  }
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
  if (!m) {
    const d = new Date(String(s));
    return Number.isNaN(d.getTime()) ? to12hText(String(s)) : fmtDate(d, true);
  }
  const [, , mo, dd, hh, mi, ss] = m;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const h = Number(hh);
  const h12 = h % 12 || 12;
  return `${dd} ${months[Number(mo) - 1] ?? mo}, ${h12}:${mi}${ss ? `:${ss}` : ""} ${h < 12 ? "AM" : "PM"}`;
}

/**
 * Last-resort guard: rewrite any 24-hour clock time inside free text ("15:28", "04:13:09")
 * to 12-hour ("3:28 PM", "4:13:09 AM"). Times already followed by AM/PM are left alone.
 */
export function to12hText(text: string): string {
  return text.replace(/(?<![\d:])([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?(?:\.\d+)?(?![\d:])(?!\s?(?:AM|PM|am|pm))/g,
    (_m, hh: string, mi: string, ss?: string) => {
      const h = Number(hh);
      return `${h % 12 || 12}:${mi}${ss ? `:${ss}` : ""} ${h < 12 ? "AM" : "PM"}`;
    });
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

/** Failed systemd units — prefers `failed_services_list` (v2), falls back to the "None"/CSV string. */
export function failedServiceList(d: Pick<PulseStatus, "failed_services" | "failed_services_list">): string[] {
  if (Array.isArray(d.failed_services_list)) return d.failed_services_list.filter(Boolean);
  const fs = d.failed_services;
  if (!has(fs) || /^(none|0|ok|\[\])$/i.test(String(fs).trim())) return [];
  return String(fs).split(/[,\n]+/).map((x) => x.trim()).filter(Boolean);
}

/** Numeric metric — prefers the typed `metrics` object (v2), falls back to the legacy string field. */
export function metric(d: Partial<PulseStatus> | null, key: Exclude<keyof Metrics, "load_avg">, legacy?: unknown): number | null {
  const v = d?.metrics?.[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return num(legacy);
}

export function loadAvg(d: Partial<PulseStatus> | null): string | null {
  const la = d?.metrics?.load_avg;
  if (Array.isArray(la) && la.length) return la.map((n) => n.toFixed(2)).join(", ");
  return has(d?.load_avg) ? String(d!.load_avg) : null;
}

/**
 * Timestamp from the API in the viewer's local time zone. Uses the ISO (UTC) field when
 * present; otherwise re-formats the legacy server-local string without converting.
 */
export function fmtApiTime(iso: string | undefined, legacy: string | undefined, withSeconds = false): string {
  if (has(iso)) {
    const d = new Date(String(iso));
    if (!Number.isNaN(d.getTime())) return fmtDate(d, withSeconds);
  }
  return fmtServerTs(legacy);
}

/** How old the status snapshot is (ms), from `time_iso`; null when the API doesn't send it. */
export function statusAgeMs(d: PulseStatus, now = Date.now()): number | null {
  if (!has(d.time_iso)) return null;
  const t = Date.parse(String(d.time_iso));
  return Number.isNaN(t) ? null : now - t;
}

/** A snapshot older than this means the server stopped refreshing /api/status. */
export const STALE_STATUS_MS = 2 * 60 * 1000;

/** Degraded per API contract: failed services, error alerts, nginx down, stopped containers, or stale data. */
export function degradedReasons(d: PulseStatus, now = Date.now()): string[] {
  const out: string[] = [];
  const age = statusAgeMs(d, now);
  if (age !== null && age > STALE_STATUS_MS) out.push(`status data is ${relTime(new Date(now - age))?.replace(" ago", "")} old`);
  const failed = failedServiceList(d);
  if (failed.length) out.push(`${failed.length} failed service${failed.length > 1 ? "s" : ""}`);
  if ((d.alerts ?? []).some((a) => String(a.level).toLowerCase() === "error")) out.push("error alerts");
  const ngx = String(d.nginx || "").toLowerCase();
  if (has(ngx) && ngx !== "active" && ngx !== "running") out.push("nginx down");
  const run = metric(d, "running_count", d.running_count), tot = metric(d, "total_count", d.total_count);
  if (run !== null && tot !== null && run < tot) out.push(`${tot - run} container${tot - run > 1 ? "s" : ""} stopped`);
  return out;
}
