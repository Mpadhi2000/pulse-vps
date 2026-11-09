"use client";

import { usePulse } from "@/lib/usePulse";
import { API_URL } from "@/lib/config";
import { relTime } from "@/lib/format";
import { Icon } from "./Icons";
import { MetricCards } from "./MetricCards";
import { ContainersTable } from "./ContainersTable";
import { LowerPanels } from "./LowerPanels";

const apiHost = (() => {
  try { return new URL(API_URL, "https://pulse.mayankpadhi.in").hostname; }
  catch { return "pulse.mayankpadhi.in"; }
})();

const LIVE_TEXT = { wait: "Connecting…", live: "Live", down: "Offline" } as const;

export function Dashboard() {
  const { data, state, error, lastOk, countdown, loading, newNames, refresh } = usePulse();
  const offline = state === "down";

  return (
    <div className={`wrap${offline && lastOk ? " stale" : ""}`}>
      <div className={`banner${offline ? " show" : ""}`} role="alert">
        <Icon name="wifi-off" />
        <span>Connection lost — can&apos;t reach <code>/api/status</code>. Retrying…</span>
        <span className="sub">{lastOk ? `Last good data ${relTime(lastOk)}` : error ?? ""}</span>
      </div>

      <header>
        <div className="brand">
          <div className="logo"><Icon name="pulse" /></div>
          <div>
            <h1>Pulse</h1>
            <p>{apiHost}</p>
          </div>
        </div>
        <div className={`live${state === "live" ? "" : ` ${state}`}`}>
          <span className="dot" />
          <span>{LIVE_TEXT[state]}</span>
        </div>
      </header>

      <MetricCards d={data} />
      <ContainersTable containers={data ? data.containers ?? [] : null} newNames={newNames} />
      <LowerPanels d={data} />

      <footer>
        <span>
          <Icon name="clock" size={14} /> Last updated:{" "}
          <b>{lastOk ? lastOk.toLocaleTimeString("en-IN", { hour12: false }) : "never"}</b>
        </span>
        <span>Server time: <b>{data?.time || "—"}</b></span>
        <span>
          Next refresh in <b>{countdown}</b>s
          <button
            className={`refresh-btn${loading ? " spin" : ""}`}
            type="button"
            aria-label="Refresh now"
            onClick={() => void refresh()}
          >
            <Icon name="refresh" size={14} /> Refresh
          </button>
        </span>
      </footer>
    </div>
  );
}
