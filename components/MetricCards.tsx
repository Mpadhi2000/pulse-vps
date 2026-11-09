import type { CSSProperties, ReactNode } from "react";
import type { StatusResponse } from "@/lib/types";
import { barLevel, fmtPct, has, num, prettyUptime, withUnit } from "@/lib/format";
import { Badge } from "./Badge";
import { IconTile, type IconName } from "./Icons";

function Card({
  cls, icon, title, children, color,
}: { cls: string; icon: IconName; title: string; children: ReactNode; color?: string }) {
  return (
    <article className={`card ${cls}`} style={color ? ({ "--c": color } as CSSProperties) : undefined}>
      <div className="card-head">
        <IconTile name={icon} />
        <span className="card-title">{title}</span>
      </div>
      {children}
    </article>
  );
}

function Bar({ pct, level }: { pct: number | null; level?: string }) {
  const p = Math.max(0, Math.min(100, pct ?? 0));
  return (
    <div className="bar">
      <span className={level ?? barLevel(p)} style={{ width: `${p}%` }} />
    </div>
  );
}

function Pct({ value, loading }: { value: unknown; loading: boolean }) {
  if (loading) return <span className="skeleton">00.0</span>;
  const n = num(value);
  if (n === null) return <>—</>;
  return <>{fmtPct(n)}<small>%</small></>;
}

export function MetricCards({ d }: { d: StatusResponse | null }) {
  const loading = d === null;
  const s = d ?? {};

  const load = Array.isArray(s.load_avg) ? s.load_avg.join(" · ") : s.load_avg;

  const ngx = String(s.nginx || "").toLowerCase();
  const ngxUp = ngx === "active" || ngx === "running";
  const test = s.nginx_config_test ?? s.nginx_test;
  const testOk = has(test) && /ok|success|pass|true/i.test(String(test));

  const run = num(s.running_count) ?? 0;
  const tot = num(s.total_count) ?? 0;
  const ctrLevel = tot && run < tot ? (run === 0 ? "crit" : "warn") : "";

  return (
    <section className="grid" aria-label="System metrics">
      <Card cls="c-cpu" icon="cpu" title="CPU">
        <div className="big"><Pct value={s.cpu} loading={loading} /></div>
        <div className="meta">
          {loading ? <span>—</span> : !has(s.cpu_cores) && !has(load) ? <span>Current utilisation</span> : (
            <>
              {has(s.cpu_cores) && <span><b>{s.cpu_cores}</b> cores</span>}
              {has(load) && <span>Load <b>{load}</b></span>}
            </>
          )}
        </div>
        <Bar pct={num(s.cpu)} />
      </Card>

      <Card cls="c-ram" icon="ram" title="Memory">
        <div className="big"><Pct value={s.ram_pct} loading={loading} /></div>
        <div className="meta">
          {has(s.ram_used_gb) ? <span><b>{s.ram_used_gb}</b> / {s.ram_total_gb} GB</span> : <span>—</span>}
        </div>
        <Bar pct={num(s.ram_pct)} />
      </Card>

      <Card cls="c-disk" icon="disk" title="Disk">
        <div className="big"><Pct value={s.disk_pct} loading={loading} /></div>
        <div className="meta">
          {has(s.disk_used) ? <span><b>{withUnit(s.disk_used)}</b> / {withUnit(s.disk_total)}</span> : <span>—</span>}
        </div>
        <Bar pct={num(s.disk_pct)} />
      </Card>

      <Card cls="c-up" icon="clock" title="Uptime">
        <div className="big" style={{ fontSize: 24 }}>
          {loading ? <span className="skeleton">0 days</span> : prettyUptime(s.uptime)}
        </div>
        <div className="meta">
          {has(s.boot_time) ? <span>Since <b>{s.boot_time}</b></span> : <span>{loading ? "—" : "Since last boot"}</span>}
        </div>
      </Card>

      <Card cls="c-ngx" icon="globe" title="Nginx" color={loading ? undefined : ngxUp ? "var(--green)" : "var(--red)"}>
        <div>
          {loading ? <Badge tone="gray" big>Unknown</Badge>
            : <Badge tone={ngxUp ? "green" : "red"} big>{ngxUp ? "Active" : "Down"}</Badge>}
        </div>
        <div className="meta">
          <span>Config test:{" "}
            <b style={has(test) ? { color: testOk ? "#4ade80" : "#f87171" } : undefined}>
              {has(test) ? (testOk ? "passed" : String(test)) : "—"}
            </b>
          </span>
        </div>
      </Card>

      <Card cls="c-ctr" icon="box" title="Containers">
        <div className="big">
          {loading ? <span className="skeleton">0/0</span> : <>{run}<small> / {tot}</small></>}
        </div>
        <div className="meta">
          {loading ? <span>—</span>
            : tot === 0 ? <span>No containers</span>
            : run === tot ? <span style={{ color: "#4ade80" }}>All running</span>
            : <span style={{ color: "#f87171" }}><b style={{ color: "inherit" }}>{tot - run}</b> stopped</span>}
        </div>
        <Bar pct={tot ? (run / tot) * 100 : 0} level={ctrLevel} />
      </Card>
    </section>
  );
}
