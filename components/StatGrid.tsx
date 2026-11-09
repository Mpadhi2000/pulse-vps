import type { ReactNode } from "react";
import type { PulseStatus, Sample } from "@/lib/types";
import { fmtPct, fmtServerTs, has, num, prettyUptime, usageLevel, withUnit } from "@/lib/format";
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

function Pct({ value, loading }: { value: string | undefined; loading: boolean }) {
  if (loading) return <span className="skeleton">00.0%</span>;
  const n = num(value);
  return n === null ? <>—</> : <>{fmtPct(n)}<small>%</small></>;
}

export function StatGrid({ d, samples }: { d: PulseStatus | null; samples: Sample[] }) {
  const loading = d === null;
  const s = (d ?? {}) as Partial<PulseStatus>;

  const ngx = String(s.nginx || "").toLowerCase();
  const ngxUp = ngx === "active" || ngx === "running";
  const test = s.nginx_config_test;
  const testOk = has(test) && /ok|success|pass|true/i.test(String(test));

  const run = num(s.running_count) ?? 0;
  const tot = num(s.total_count) ?? 0;

  return (
    <div className="cells cells-3" aria-label="System metrics">
      <Cell icon="cpu" title="CPU" right={has(s.cpu_cores) ? `${s.cpu_cores} cores` : undefined}>
        <div className="big"><Pct value={s.cpu} loading={loading} /></div>
        <div className="meta">{has(s.load_avg) ? <span>Load <b>{s.load_avg}</b></span> : <span>—</span>}</div>
        <Bar pct={num(s.cpu)} />
        <Sparkline samples={samples} metric="cpu" color="var(--s-cpu)" />
      </Cell>

      <Cell icon="ram" title="Memory">
        <div className="big"><Pct value={s.ram_pct} loading={loading} /></div>
        <div className="meta">{has(s.ram_used_gb) ? <span><b>{s.ram_used_gb} GB</b> of {s.ram_total_gb} GB</span> : <span>—</span>}</div>
        <Bar pct={num(s.ram_pct)} />
        <Sparkline samples={samples} metric="ram" color="var(--s-ram)" />
      </Cell>

      <Cell icon="disk" title="Disk">
        <div className="big"><Pct value={s.disk_pct} loading={loading} /></div>
        <div className="meta">{has(s.disk_used) ? <span><b>{withUnit(s.disk_used)}</b> of {withUnit(s.disk_total)}</span> : <span>—</span>}</div>
        <Bar pct={num(s.disk_pct)} />
        <Sparkline samples={samples} metric="disk" color="var(--s-disk)" />
      </Cell>

      <Cell icon="clock" title="Uptime">
        <div className="big md">{loading ? <span className="skeleton">0 days, 0h</span> : prettyUptime(s.uptime)}</div>
        <div className="meta">{has(s.boot_time) ? <span>Booted <b>{fmtServerTs(s.boot_time)}</b></span> : <span>—</span>}</div>
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
