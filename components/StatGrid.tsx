import type { ReactNode } from "react";
import type { PulseStatus, Sample } from "@/lib/types";
import { fmtApiTime, fmtPct, has, loadAvg, metric, prettyUptime, usageLevel, withUnit } from "@/lib/format";
import { Badge } from "./Badge";
import { Icon, type IconName } from "./Icons";
import { Sparkline } from "./Sparkline";

function Cell({ icon, title, right, children }: { icon: IconName; title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <article className="cell">
      <div className="cell-head"><Icon name={icon} />{title}{right !== undefined && <span className="right">{right}</span>}</div>
      {children}
    </article>
  );
}

function Bar({ pct, level }: { pct: number | null; level?: string }) {
  const p = Math.max(0, Math.min(100, pct ?? 0));
  const lv = level ?? usageLevel(pct);
  return <div className="bar"><span className={lv === "ok" ? "" : lv} style={{ width: `${p}%` }} /></div>;
}

function Pct({ value: n, loading }: { value: number | null; loading: boolean }) {
  if (loading) return <span className="skeleton">00.0%</span>;
  return n === null ? <>—</> : <>{fmtPct(n)}<small>%</small></>;
}

export function StatGrid({ d, samples }: { d: PulseStatus | null; samples: Sample[] }) {
  const loading = d === null;
  const s = (d ?? {}) as Partial<PulseStatus>;

  const ngx = String(s.nginx || "").toLowerCase();
  const ngxUp = ngx === "active" || ngx === "running";
  const test = s.nginx_config_test;
  const testOk = has(test) && /ok|success|pass|true/i.test(String(test));

  // /api/status is refreshed every few minutes, /api/history every 15s — show whichever is newer.
  const statusT = has(s.time_iso) ? Date.parse(String(s.time_iso)) : NaN;
  const latest = samples.length ? samples[samples.length - 1] : null;
  const live = latest && (Number.isNaN(statusT) || latest.t > statusT) ? latest : null;
  const cpu = live?.cpu ?? metric(s, "cpu", s.cpu);
  const ram = live?.ram ?? metric(s, "ram_pct", s.ram_pct);
  const disk = live?.disk ?? metric(s, "disk_pct", s.disk_pct);
  const cores = metric(s, "cpu_cores", s.cpu_cores);
  const load = loadAvg(s);
  const ramUsed = metric(s, "ram_used_gb", s.ram_used_gb);
  const ramTotal = metric(s, "ram_total_gb", s.ram_total_gb);
  const diskUsed = s.metrics?.disk_used_gb;
  const diskTotal = s.metrics?.disk_total_gb;
  const diskText = typeof diskUsed === "number" && typeof diskTotal === "number"
    ? [`${diskUsed} GB`, `${diskTotal} GB`]
    : has(s.disk_used) ? [withUnit(s.disk_used), withUnit(s.disk_total)] : null;
  const run = metric(s, "running_count", s.running_count) ?? 0;
  const tot = metric(s, "total_count", s.total_count) ?? 0;

  return (
    <div className="cells cells-3" aria-label="System metrics">
      <Cell icon="cpu" title="CPU" right={cores !== null ? `${cores} cores` : undefined}>
        <div className="big"><Pct value={cpu} loading={loading} /></div>
        <div className="meta">{load ? <span>Load <b>{load}</b></span> : <span>—</span>}</div>
        <Bar pct={cpu} />
        <Sparkline samples={samples} metric="cpu" color="var(--s-cpu)" />
      </Cell>

      <Cell icon="ram" title="Memory">
        <div className="big"><Pct value={ram} loading={loading} /></div>
        <div className="meta">{ramUsed !== null ? <span><b>{ramUsed} GB</b> of {ramTotal ?? "—"} GB</span> : <span>—</span>}</div>
        <Bar pct={ram} />
        <Sparkline samples={samples} metric="ram" color="var(--s-ram)" />
      </Cell>

      <Cell icon="disk" title="Disk">
        <div className="big"><Pct value={disk} loading={loading} /></div>
        <div className="meta">{diskText ? <span><b>{diskText[0]}</b> of {diskText[1]}</span> : <span>—</span>}</div>
        <Bar pct={disk} />
        <Sparkline samples={samples} metric="disk" color="var(--s-disk)" />
      </Cell>

      <Cell icon="clock" title="Uptime">
        <div className="big md">{loading ? <span className="skeleton">0 days, 0h</span> : prettyUptime(s.uptime)}</div>
        <div className="meta">{has(s.boot_time_iso) || has(s.boot_time) ? <span>Booted <b>{fmtApiTime(s.boot_time_iso, s.boot_time)}</b></span> : <span>—</span>}</div>
      </Cell>

      <Cell icon="globe" title="Nginx">
        <div style={{ marginTop: 12 }}>
          {loading ? <Badge lg dot>Unknown</Badge> : <Badge lg dot tone={ngxUp ? "ok" : "crit"}>{ngxUp ? "Active" : "Down"}</Badge>}
        </div>
        <div className="meta">
          <span>Config test <b className={has(test) ? (testOk ? "ok" : "crit") : undefined}>{has(test) ? (testOk ? "passed" : String(test)) : "—"}</b></span>
        </div>
      </Cell>

      <Cell icon="box" title="Containers">
        <div className="big md">{loading ? <span className="skeleton">0 / 0</span> : <>{run}<small> / {tot} running</small></>}</div>
        <div className="meta">
          {loading ? <span>—</span>
            : tot === 0 ? <span>No containers</span>
            : run === tot ? <span className="ok">All running</span>
            : <span className="crit">{tot - run} stopped</span>}
        </div>
        <Bar pct={tot ? (run / tot) * 100 : 0} level={tot && run < tot ? (run === 0 ? "crit" : "warn") : "ok"} />
      </Cell>
    </div>
  );
}
