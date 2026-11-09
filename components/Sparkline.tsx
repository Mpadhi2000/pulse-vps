"use client";

import { useId } from "react";
import type { MetricKey, Sample } from "@/lib/types";
import { inRange, segments, type Point } from "@/lib/series";
import { REFRESH_INTERVAL_S } from "@/lib/config";

const W = 240, H = 44;
const WINDOW_MS = 30 * 60 * 1000;

/** Tiny last-30-minutes area chart for a metric card. Scales 0–100%. */
export function Sparkline({ samples, metric, color = "var(--fg)" }: { samples: Sample[]; metric: MetricKey; color?: string }) {
  const gid = useId().replace(/:/g, "");
  const last = samples.length ? samples[samples.length - 1].t : Date.now();
  const pts: Point[] = inRange(samples, WINDOW_MS, last).map((s) => ({ t: s.t, v: s[metric] }));
  const valid = pts.filter((p) => p.v !== null);

  if (valid.length < 2) return <div className="spark-empty">Collecting history…</div>;

  const t0 = pts[0].t, t1 = pts[pts.length - 1].t || t0 + 1;
  const x = (t: number) => ((t - t0) / Math.max(t1 - t0, 1)) * W;
  const y = (v: number) => H - 2 - (Math.max(0, Math.min(100, v)) / 100) * (H - 4);
  const segs = segments(pts, REFRESH_INTERVAL_S * 3 * 1000);
  const line = segs.map((s) => s.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.v!).toFixed(1)}`).join("")).join("");
  const area = segs
    .filter((s) => s.length > 1)
    .map((s) => `M${x(s[0].t)},${H}` + s.map((p) => `L${x(p.t).toFixed(1)},${y(p.v!).toFixed(1)}`).join("") + `L${x(s[s.length - 1].t)},${H}Z`)
    .join("");
  const end = valid[valid.length - 1];

  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={x(end.t)} cy={y(end.v!)} r="2.5" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
