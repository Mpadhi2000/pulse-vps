"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { MetricKey, Sample } from "@/lib/types";
import { bucketize, inRange, METRICS, segments, stats } from "@/lib/series";
import { fmtClock, fmtDate, fmtPct } from "@/lib/format";
import { REFRESH_INTERVAL_S } from "@/lib/config";
import { Icon } from "./Icons";

const RANGES = [
  { label: "15m", ms: 15 * 60e3 },
  { label: "1h", ms: 60 * 60e3 },
  { label: "6h", ms: 6 * 60 * 60e3 },
  { label: "24h", ms: 24 * 60 * 60e3 },
] as const;

type View = "all" | MetricKey;
const PAD = { l: 40, r: 8, t: 8, b: 24 };
const Y_TICKS = [0, 25, 50, 75, 100];

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 800, h: 280 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

export function UsageChart({ samples, onClear }: { samples: Sample[]; onClear: () => void }) {
  const [view, setView] = useState<View>("all");
  const [rangeIdx, setRangeIdx] = useState(1);
  const [hover, setHover] = useState<number | null>(null);
  const [svgRef, { w, h }] = useSize<HTMLDivElement>();
  const range = RANGES[rangeIdx];

  const end = samples.length ? samples[samples.length - 1].t : 0;
  const visible = useMemo(() => inRange(samples, range.ms, end), [samples, range.ms, end]);
  const shown = METRICS.filter((m) => view === "all" || m.key === view);

  const plotW = Math.max(w - PAD.l - PAD.r, 10);
  const plotH = Math.max(h - PAD.t - PAD.b, 10);
  const { points, bucketMs } = useMemo(() => bucketize(visible, Math.floor(plotW / 3)), [visible, plotW]);
  const gapMs = Math.max(REFRESH_INTERVAL_S * 3 * 1000, bucketMs * 2.5);

  const t0 = points.length ? points[0].t : 0;
  const t1 = points.length ? points[points.length - 1].t : 1;
  const span = Math.max(t1 - t0, 1);
  const x = (t: number) => PAD.l + ((t - t0) / span) * plotW;
  const y = (v: number) => PAD.t + plotH - (Math.max(0, Math.min(100, v)) / 100) * plotH;
  const enough = points.length >= 2;

  const xTicks = useMemo(() => {
    if (!enough) return [];
    const n = Math.max(2, Math.min(6, Math.floor(plotW / 110)));
    return Array.from({ length: n }, (_, i) => t0 + (span * i) / (n - 1));
  }, [enough, plotW, t0, span]);
  const withSeconds = span < 10 * 60e3;

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!enough) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const t = t0 + ((e.clientX - rect.left - PAD.l) / plotW) * span;
    let best = 0, bestD = Infinity;
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(points[i].t - t);
      if (d < bestD) { bestD = d; best = i; }
    }
    setHover(best);
  };

  const hp = hover !== null && enough ? points[Math.min(hover, points.length - 1)] : null;
  const firstT = samples.length ? samples[0].t : null;

  return (
    <section className="panel" aria-label="Resource usage over time">
      <div className="panel-head">
        <Icon name="chart" />
        <h3>Resource usage</h3>
        <div className="right">
          <div className="seg" role="group" aria-label="Time range">
            {RANGES.map((r, i) => (
              <button key={r.label} type="button" aria-pressed={i === rangeIdx} onClick={() => setRangeIdx(i)}>{r.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-stats">
        {METRICS.map((m) => {
          const st = stats(visible, m.key);
          return (
            <div className="chart-stat" key={m.key}>
              <div className="k" style={{ color: "var(--muted)" }}>
                <span className={`swatch${m.dashed ? " dashed" : ""}`} style={{ color: m.color }} />
                {m.label}
              </div>
              <div className="v">
                {st ? <>{fmtPct(Number(st.current.toFixed(1)))}%<small>avg {st.avg.toFixed(1)}% · peak {fmtPct(st.peak)}%</small></> : "—"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="chart-toolbar">
        <div className="seg" role="group" aria-label="Series">
          <button type="button" aria-pressed={view === "all"} onClick={() => setView("all")}>All</button>
          {METRICS.map((m) => (
            <button key={m.key} type="button" aria-pressed={view === m.key} onClick={() => setView(m.key)}>
              <span className={`swatch${m.dashed ? " dashed" : ""}`} style={{ color: m.color }} />
              {m.label}
            </button>
          ))}
        </div>
        <span style={{ color: "var(--dim)", fontSize: 12 }}>
          {visible.length} samples · every {REFRESH_INTERVAL_S}s
        </span>
      </div>

      <div className="chart-wrap" ref={svgRef}>
        <svg
          className="chart"
          viewBox={`0 0 ${w} ${h}`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label={`Line chart of ${shown.map((m) => m.label).join(", ")} usage over the last ${range.label}`}
        >
          <defs>
            {shown.map((m) => (
              <linearGradient key={m.key} id={`fill-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={m.color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={m.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {Y_TICKS.map((v) => (
            <g key={v}>
              <line className={`gridline${v === 0 ? " base" : ""}`} x1={PAD.l} x2={PAD.l + plotW} y1={y(v)} y2={y(v)} strokeDasharray={v === 0 ? undefined : "2 4"} />
              <text className="tick" x={PAD.l - 8} y={y(v)} dy="0.32em" textAnchor="end">{v}%</text>
            </g>
          ))}
          {xTicks.map((t, i) => (
            <text key={i} className="tick" x={x(t)} y={h - 6}
              textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}>
              {fmtClock(t, withSeconds)}
            </text>
          ))}

          {enough && shown.map((m) => {
            const segs = segments(points.map((p) => ({ t: p.t, v: p[m.key] })), gapMs);
            const line = segs.map((s) => s.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.v!).toFixed(1)}`).join("")).join("");
            const area = view !== "all"
              ? segs.filter((s) => s.length > 1).map((s) =>
                  `M${x(s[0].t)},${y(0)}` + s.map((p) => `L${x(p.t).toFixed(1)},${y(p.v!).toFixed(1)}`).join("") + `L${x(s[s.length - 1].t)},${y(0)}Z`,
                ).join("")
              : "";
            return (
              <g key={m.key}>
                {area && <path d={area} fill={`url(#fill-${m.key})`} />}
                <path d={line} fill="none" stroke={m.color} strokeWidth={view === "all" ? 1.5 : 2}
                  strokeDasharray={m.dashed && view === "all" ? "4 3" : undefined} strokeLinejoin="round" strokeLinecap="round" />
              </g>
            );
          })}

          {hp && (
            <g>
              <line className="crosshair" x1={x(hp.t)} x2={x(hp.t)} y1={PAD.t} y2={PAD.t + plotH} />
              {shown.map((m) => hp[m.key] !== null && (
                <circle key={m.key} cx={x(hp.t)} cy={y(hp[m.key]!)} r="4" fill="var(--surface)" stroke={m.color} strokeWidth="2" />
              ))}
            </g>
          )}
        </svg>

        {!enough && (
          <div className="chart-empty">
            <div>
              <b>Collecting data…</b>
              The API reports current values only — history builds up in this browser every {REFRESH_INTERVAL_S}s.
            </div>
          </div>
        )}

        {hp && (
          <div className="tooltip" style={x(hp.t) > w / 2 ? { right: w - x(hp.t) + 12 } : { left: x(hp.t) + 12 }}>
            <div className="t">{fmtDate(hp.t, true)}</div>
            {shown.map((m) => (
              <div className="row" key={m.key}>
                <span className={`swatch${m.dashed ? " dashed" : ""}`} style={{ color: m.color }} />
                <span>{m.label}</span>
                <span>{hp[m.key] !== null ? `${hp[m.key]!.toFixed(1)}%` : "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="chart-foot">
        <span>
          History is stored in this browser{firstT ? ` since ${fmtDate(firstT)}` : ""} (up to 24h).
        </span>
        {samples.length > 0 && <button type="button" className="link-btn" onClick={onClear}>Clear history</button>}
      </div>
    </section>
  );
}
