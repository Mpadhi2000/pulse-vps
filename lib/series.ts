import type { MetricKey, Sample } from "./types";
import { REFRESH_INTERVAL_S } from "./config";

export type Point = { t: number; v: number | null };

export const METRICS: { key: MetricKey; label: string; color: string; dashed?: boolean }[] = [
  { key: "cpu", label: "CPU", color: "var(--s-cpu)" },
  { key: "ram", label: "Memory", color: "var(--s-ram)" },
  { key: "disk", label: "Disk", color: "var(--s-disk)", dashed: true },
];

/** Samples within [end - rangeMs, end]. */
export const inRange = (samples: Sample[], rangeMs: number, end = Date.now()) =>
  samples.filter((s) => s.t >= end - rangeMs && s.t <= end);

/**
 * Average samples into at most `maxPoints` time buckets so long ranges stay cheap to draw.
 * Empty buckets are dropped; gaps are detected later by time distance.
 */
export function bucketize(samples: Sample[], maxPoints: number): { points: Sample[]; bucketMs: number } {
  if (samples.length <= maxPoints || samples.length < 2) {
    return { points: samples, bucketMs: REFRESH_INTERVAL_S * 1000 };
  }
  const t0 = samples[0].t, t1 = samples[samples.length - 1].t;
  const bucketMs = Math.max((t1 - t0) / maxPoints, 1);
  const out: Sample[] = [];
  let idx = -1;
  let acc = { t: 0, cpu: 0, ram: 0, disk: 0, nc: 0, nr: 0, nd: 0, n: 0 };
  const flush = () => {
    if (!acc.n) return;
    out.push({
      t: acc.t / acc.n,
      cpu: acc.nc ? acc.cpu / acc.nc : null,
      ram: acc.nr ? acc.ram / acc.nr : null,
      disk: acc.nd ? acc.disk / acc.nd : null,
    });
  };
  for (const s of samples) {
    const b = Math.min(Math.floor((s.t - t0) / bucketMs), maxPoints - 1);
    if (b !== idx) { flush(); idx = b; acc = { t: 0, cpu: 0, ram: 0, disk: 0, nc: 0, nr: 0, nd: 0, n: 0 }; }
    acc.t += s.t; acc.n++;
    if (s.cpu !== null) { acc.cpu += s.cpu; acc.nc++; }
    if (s.ram !== null) { acc.ram += s.ram; acc.nr++; }
    if (s.disk !== null) { acc.disk += s.disk; acc.nd++; }
  }
  flush();
  return { points: out, bucketMs };
}

/** Split into continuous runs, breaking on missing values or time gaps larger than `gapMs`. */
export function segments(points: Point[], gapMs: number): Point[][] {
  const out: Point[][] = [];
  let cur: Point[] = [];
  let prevT = -Infinity;
  for (const p of points) {
    if (p.v === null || p.t - prevT > gapMs) {
      if (cur.length) out.push(cur);
      cur = [];
    }
    if (p.v !== null) cur.push(p);
    prevT = p.t;
  }
  if (cur.length) out.push(cur);
  return out;
}

export function stats(samples: Sample[], key: MetricKey) {
  const vals = samples.map((s) => s[key]).filter((v): v is number => v !== null);
  if (!vals.length) return null;
  return {
    current: vals[vals.length - 1],
    avg: vals.reduce((a, b) => a + b, 0) / vals.length,
    peak: Math.max(...vals),
    min: Math.min(...vals),
  };
}
