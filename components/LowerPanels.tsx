import type { ReactNode } from "react";
import type { Alert, FailedService, StatusResponse } from "@/lib/types";
import { fmtDate, has, parseBackupTs, relTime } from "@/lib/format";
import { Badge, type Tone } from "./Badge";
import { Icon, IconTile, type IconName } from "./Icons";

function Panel({
  icon, color, title, count, children,
}: { icon: IconName; color: string; title: string; count?: ReactNode; children: ReactNode }) {
  return (
    <article className="panel">
      <div className="panel-head">
        <IconTile name={icon} color={color} />
        <h2>{title}</h2>
        {count !== undefined && <span className="count">{count}</span>}
      </div>
      <div className="panel-body">{children}</div>
    </article>
  );
}

const Ok = ({ children }: { children: ReactNode }) => (
  <div className="ok-state"><IconTile name="check" />{children}</div>
);
const Muted = ({ children }: { children: ReactNode }) => <div className="muted-state">{children}</div>;

function Services({ fs }: { fs: StatusResponse["failed_services"] }) {
  let items: (string | FailedService)[] = [];
  if (Array.isArray(fs)) items = fs;
  else if (has(fs) && !/^(none|0|ok|\[\])$/i.test(String(fs).trim()))
    items = String(fs).split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);

  if (!items.length) return <Ok>All services running</Ok>;
  return (
    <ul className="list">
      {items.map((it, i) => {
        const obj = typeof it === "object" ? it : null;
        const name = obj ? obj.name : (it as string);
        const sev = String(obj?.severity || "high").toLowerCase();
        const tone: Tone = sev === "critical" || sev === "high" ? "red" : sev === "medium" ? "amber" : "gray";
        return (
          <li key={`${name}-${i}`}>
            <span style={{ color: "#f87171" }}><Icon name="x" /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t">{name}</div>
              {obj?.since && <div className="s">{obj.since}</div>}
            </div>
            <Badge tone={tone}>{sev}</Badge>
          </li>
        );
      })}
    </ul>
  );
}

const ALERT_STYLE: Record<string, [Tone, string, IconName]> = {
  critical: ["red", "#f87171", "alert"],
  error: ["red", "#f87171", "alert"],
  warning: ["amber", "#fbbf24", "alert"],
  warn: ["amber", "#fbbf24", "alert"],
  resolved: ["green", "#4ade80", "check"],
  info: ["blue", "#60a5fa", "info"],
};

function Alerts({ alerts }: { alerts: Alert[] | undefined }) {
  if (!Array.isArray(alerts)) return <Muted>No alert data from API</Muted>;
  if (!alerts.length) return <Ok>No recent incidents</Ok>;
  return (
    <ul className="list">
      {alerts.slice(0, 5).map((a, i) => {
        const lvl = String(a.level || a.severity || "info").toLowerCase();
        const [tone, col, ic] = ALERT_STYLE[lvl] || ALERT_STYLE.info;
        return (
          <li key={i}>
            <span style={{ color: col }}><Icon name={ic} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t">{a.message || a.title || "Alert"}</div>
              <div className="s">{a.time || a.timestamp || ""}</div>
            </div>
            <Badge tone={tone}>{lvl}</Badge>
          </li>
        );
      })}
    </ul>
  );
}

function backupBadge(d: StatusResponse, ageH: number | null) {
  const status = String(d.backup_status || "").toLowerCase();
  if (/complete|success|ok/.test(status))
    return ageH !== null && ageH > 26 ? <Badge tone="amber">stale</Badge> : <Badge tone="green">complete</Badge>;
  if (/fail|error/.test(status)) return <Badge tone="red">failed</Badge>;
  if (/run|progress/.test(status)) return <Badge tone="blue">running</Badge>;
  return <Badge tone="gray">unknown</Badge>;
}

function Backup({ d }: { d: StatusResponse }) {
  const ts = parseBackupTs(d.last_backup);
  const ageH = ts ? (Date.now() - ts.getTime()) / 3.6e6 : null;
  const upload = d.backup_upload ?? d.upload_status;
  const uploadOk = has(upload) && /ok|success|complete|uploaded|true/i.test(String(upload));

  const rows: [string, ReactNode, string?][] = [
    ["Last backup", ts ? fmtDate(ts) : d.last_backup || "—"],
    ["Age", ts ? <span style={{ color: ageH! > 26 ? "#fbbf24" : "#4ade80" }}>{relTime(ts)}</span> : "—"],
    ["Archive size", has(d.backup_size) ? String(d.backup_size) : "—"],
    ["Upload", has(upload)
      ? <span style={{ color: uploadOk ? "#4ade80" : "#f87171" }}>{uploadOk ? "uploaded" : String(upload)}</span>
      : "—"],
    ["Status", d.backup_status || "—", "mono"],
  ];
  return (
    <dl className="kv">
      {rows.map(([k, v, c]) => (
        <div key={k} style={{ display: "contents" }}>
          <dt>{k}</dt>
          <dd className={c}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LowerPanels({ d }: { d: StatusResponse | null }) {
  const ts = d ? parseBackupTs(d.last_backup) : null;
  const ageH = ts ? (Date.now() - ts.getTime()) / 3.6e6 : null;
  return (
    <section className="lower">
      <Panel icon="alert" color="var(--rose)" title="Systemd services">
        {d ? <Services fs={d.failed_services} /> : <Muted>Loading…</Muted>}
      </Panel>
      <Panel icon="bell" color="var(--amber)" title="Recent alerts" count="last 5">
        {d ? <Alerts alerts={d.alerts} /> : <Muted>Loading…</Muted>}
      </Panel>
      <Panel icon="archive" color="var(--emerald)" title="Backup" count={d ? backupBadge(d, ageH) : ""}>
        {d ? <Backup d={d} /> : <dl className="kv"><dt>Last backup</dt><dd>—</dd></dl>}
      </Panel>
    </section>
  );
}
