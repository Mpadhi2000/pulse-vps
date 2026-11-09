"use client";

import { usePulse } from "@/lib/usePulse";
import { PULSE_API_URL, REFRESH_INTERVAL_S, SITE_HOST, STATUS_ENDPOINT } from "@/lib/config";
import { degradedReasons, fmtApiTime, fmtTime, relTime } from "@/lib/format";
import { useServerHistory } from "@/lib/useServerHistory";
import { Icon } from "./Icons";
import { ThemeToggle } from "./ThemeToggle";
import { StatGrid } from "./StatGrid";
import { UsageChart } from "./UsageChart";
import { ContainersTable } from "./ContainersTable";
import { LowerPanels } from "./LowerPanels";

const apiHost = (() => {
  try { return new URL(PULSE_API_URL).hostname; } catch { return PULSE_API_URL; }
})();

export function Dashboard() {
  const { data, connection, error, lastOk, countdown, loading, newNames, refresh, tick, localSamples, clearLocalHistory } = usePulse();
  // Sparklines: last hour from the server, falling back to browser-collected samples.
  const spark = useServerHistory("1h", tick);
  const sparkSamples = spark.ok === false ? localSamples : spark.samples ?? [];
  const reasons = data ? degradedReasons(data) : [];
  const offline = connection === "offline";

  const status =
    connection === "connecting" ? { dot: "", text: "Connecting…", title: "Checking systems" }
    : offline ? { dot: "crit", text: "Offline", title: "Can’t reach the server" }
    : reasons.length ? { dot: "warn", text: "Degraded", title: "Some systems degraded" }
    : { dot: "ok", text: "Operational", title: "All systems operational" };

  return (
    <div className={offline && lastOk ? "stale" : undefined}>
      <nav className="nav">
        <div className="container nav-inner">
          <div className="brand">
            <span className="logo"><Icon name="pulse" /></span>
            Pulse
          </div>
          <span className="slash">/</span>
          <span className="host">{SITE_HOST}</span>
          <div className="nav-right">
            <span className="pill"><span className={`dot ${status.dot}`} />{status.text}</span>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="container">
          <span className="eyebrow"><span className={`dot ${status.dot}`} />{SITE_HOST}</span>
          <h1><span className="soft">{status.title}</span></h1>
          <p className="lead">
            Live CPU, memory and disk usage, containers, services and backups for the VPS — refreshed every {REFRESH_INTERVAL_S} seconds.
          </p>
          <div className="hero-actions">
            <button type="button" className={`btn btn-primary${loading ? " spin" : ""}`} onClick={() => void refresh()}>
              <Icon name="refresh" /> Refresh now
            </button>
            <a className="btn btn-secondary" href="#usage"><Icon name="chart" /> View usage</a>
          </div>
          <div className="hero-meta">
            <span>Last updated <b>{lastOk ? fmtTime(lastOk) : "never"}</b></span>
            <span>Next refresh in <b>{countdown}s</b></span>
          </div>
        </div>
      </header>

      <main className="container">
        {offline && (
          <div className="banner" role="alert">
            <Icon name="wifi-off" />
            <span>Connection lost — can&apos;t reach <code>{STATUS_ENDPOINT.replace(/^https?:\/\//, "")}</code>. Retrying…</span>
            <span className="sub">{lastOk ? `Last good data ${relTime(lastOk)}` : error ?? ""}</span>
          </div>
        )}
        {!offline && reasons.length > 0 && (
          <div className="banner warn" role="status">
            <Icon name="alert" />
            <span>Degraded: {reasons.join(", ")}</span>
          </div>
        )}

        <section className="section" aria-label="Overview">
          <div className="section-head">
            <div><h2>Overview</h2><p>Current readings from the server.</p></div>
          </div>
          <StatGrid d={data} samples={sparkSamples} />
        </section>

        <section className="section" id="usage" style={{ scrollMarginTop: 80 }}>
          <div className="section-head">
            <div><h2>Usage</h2><p>CPU, memory and disk over time.</p></div>
          </div>
          <UsageChart tick={tick} localSamples={localSamples} onClearLocal={clearLocalHistory} />
        </section>

        <section className="section">
          <div className="section-head">
            <div><h2>Workloads</h2><p>Docker containers running on the host.</p></div>
          </div>
          <ContainersTable containers={data ? data.containers ?? [] : null} newNames={newNames} />
        </section>

        <section className="section">
          <div className="section-head">
            <div><h2>Health</h2><p>Services, alerts and backups.</p></div>
          </div>
          <LowerPanels d={data} />
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span><Icon name="pulse" size={14} /> <b>Pulse</b> · VPS status</span>
          <span>Server time <b>{data ? fmtApiTime(data.time_iso, data.time, true) : "—"}</b></span>
          <span>API <b className="mono">{apiHost}/api/status</b></span>
        </div>
      </footer>
    </div>
  );
}
