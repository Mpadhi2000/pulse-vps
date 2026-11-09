import type { ReactNode } from "react";
import type { Alert, PulseStatus } from "@/lib/types";
import { failedServiceList, fmtDate, has, parseBackupTs, relTime } from "@/lib/format";
import { Badge, type Tone } from "./Badge";
import { Icon, type IconName } from "./Icons";

function Panel({ icon, title, right, children }: { icon: IconName; title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <article className="panel">
      <div className="panel-head"><Icon name={icon} /><h3>{title}</h3>{right !== undefined && <span className="right">{right}</span>}</div>
      <div className="panel-body">{children}</div>
    </article>
  );
}

const Ok = ({ children }: { children: ReactNode }) => (
  <div className="state"><span className="ico"><Icon name="check" size={14} /></span>{children}</div>
);
const Muted = ({ children }: { children: ReactNode }) => <div className="state muted">{children}</div>;

function Services({ fs }: { fs: string }) {
  const items = failedServiceList(fs);
  if (!items.length) return <Ok>All services running</Ok>;
  return (
    <ul className="list">
      {items.map((name, i) => (
        <li key={`${name}-${i}`}>
          <span className="ico c-crit"><Icon name="x" /></span>
          <div style={{ flex: 1, minWidth: 0 }}><div className="t mono">{name}</div></div>
          <Badge tone="crit">failed</Badge>
        </li>
      ))}
    </ul>
  );
}

const ALERT_STYLE: Record<string, [Tone, string, IconName]> = {
  error: ["crit", "c-crit", "alert"],
  critical: ["crit", "c-crit", "alert"],
  warning: ["warn", "c-warn", "alert"],
  info: ["info", "c-info", "info"],
};

function Alerts({ alerts }: { alerts: Alert[] | undefined }) {
  if (!Array.isArray(alerts)) return <Muted>No alert data from API</Muted>;
  if (!alerts.length) return <Ok>No recent incidents</Ok>;
  return (
    <ul className="list">
      {alerts.slice(0, 5).map((a, i) => {
        const lvl = String(a.level || "info").toLowerCase();
        const [tone, cls, ic] = ALERT_STYLE[lvl] || ALERT_STYLE.info;
        const when = new Date(a.time);
        return (
          <li key={i}>
            <span className={`ico ${cls}`}><Icon name={ic} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t">{a.message || "Alert"}</div>
              <div className="s">{Number.isNaN(when.getTime()) ? a.time : fmtDate(when)}</div>
            </div>
            <Badge tone={tone}>{lvl}</Badge>
          </li>
        );
      })}
    </ul>
  );
}

function backupBadge(status: string, ageH: number | null) {
  const s = status.toLowerCase();
  if (/complete|success|ok/.test(s)) return ageH !== null && ageH > 26 ? <Badge tone="warn">stale</Badge> : <Badge tone="ok">complete</Badge>;
  if (/fail|error/.test(s)) return <Badge tone="crit">failed</Badge>;
  if (/run|progress/.test(s)) return <Badge tone="info">running</Badge>;
  return <Badge>unknown</Badge>;
}

function Backup({ d, ts, ageH }: { d: PulseStatus; ts: Date | null; ageH: number | null }) {
  const upload = d.backup_upload;
  const uploadOk = has(upload) && /ok|success|complete|uploaded|true/i.test(String(upload));
  const rows: [string, ReactNode, string?][] = [
    ["Last backup", ts ? fmtDate(ts) : d.last_backup || "—"],
    ["Age", ts ? <span className={ageH! > 26 ? "c-warn" : "c-ok"}>{relTime(ts)}</span> : "—"],
    ["Archive size", has(d.backup_size) ? d.backup_size : "—"],
    ["Upload", has(upload) ? <span className={uploadOk ? "c-ok" : "c-crit"}>{uploadOk ? "uploaded" : upload}</span> : "—"],
    ["Status", d.backup_status || "—", "mono"],
  ];
  return (
    <dl className="kv">
      {rows.map(([k, v, c]) => (
        <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd className={c}>{v}</dd></div>
      ))}
    </dl>
  );
}

export function LowerPanels({ d }: { d: PulseStatus | null }) {
  const ts = d ? parseBackupTs(d.last_backup) : null;
  const ageH = ts ? (Date.now() - ts.getTime()) / 3.6e6 : null;
  return (
    <div className="lower">
      <Panel icon="alert" title="Systemd services">
        {d ? <Services fs={d.failed_services} /> : <Muted>Loading…</Muted>}
      </Panel>
      <Panel icon="bell" title="Recent alerts" right="last 5">
        {d ? <Alerts alerts={d.alerts} /> : <Muted>Loading…</Muted>}
      </Panel>
      <Panel icon="archive" title="Backup" right={d ? backupBadge(String(d.backup_status || ""), ageH) : undefined}>
        {d ? <Backup d={d} ts={ts} ageH={ageH} /> : <Muted>Loading…</Muted>}
      </Panel>
    </div>
  );
}
