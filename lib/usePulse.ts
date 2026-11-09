"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PulseStatus } from "./types";
import { REFRESH_INTERVAL_S, STATUS_ENDPOINT, TIMEOUT_MS } from "./config";
import { metric } from "./format";
import { useHistory } from "./useHistory";

export type Connection = "connecting" | "online" | "offline";

/** Polls the status API, records usage history, exposes countdown + manual refresh. */
export function usePulse() {
  const [data, setData] = useState<PulseStatus | null>(null);
  const [connection, setConnection] = useState<Connection>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [lastOk, setLastOk] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_S);
  const [loading, setLoading] = useState(false);
  const [newNames, setNewNames] = useState<Set<string>>(new Set());
  /** Increments after every successful poll — lets dependent fetches (history) follow along. */
  const [tick, setTick] = useState(0);
  const history = useHistory();
  const { push } = history;

  const known = useRef<Set<string> | null>(null);
  const inFlight = useRef(false);
  const lastOkRef = useRef<Date | null>(null);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(STATUS_ENDPOINT, {
        cache: "no-store",
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = (await res.json()) as PulseStatus;

      // Highlight containers that appeared since the previous poll (not on first load).
      const names = new Set((d.containers ?? []).map((c) => String(c.name || "unnamed")));
      const prev = known.current;
      setNewNames(prev ? new Set([...names].filter((n) => !prev.has(n))) : new Set());
      known.current = names;

      const now = new Date();
      lastOkRef.current = now;
      // Local copy is only a fallback for when /api/history is unavailable.
      push({ t: now.getTime(), cpu: metric(d, "cpu", d.cpu), ram: metric(d, "ram_pct", d.ram_pct), disk: metric(d, "disk_pct", d.disk_pct) });
      setData(d);
      setLastOk(now);
      setError(null);
      setConnection("online");
      setTick((n) => n + 1);
    } catch (e) {
      const err = e as Error;
      setError(err.name === "AbortError" ? "Request timed out" : err.message);
      setConnection("offline");
    } finally {
      clearTimeout(timer);
      inFlight.current = false;
      setLoading(false);
      setCountdown(REFRESH_INTERVAL_S);
    }
  }, [push]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    const id = setInterval(() => setCountdown((c) => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (countdown === 0) void refresh();
  }, [countdown, refresh]);

  useEffect(() => {
    const onVis = () => {
      const ok = lastOkRef.current;
      if (!document.hidden && ok && Date.now() - ok.getTime() > REFRESH_INTERVAL_S * 1000) void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  return {
    data, connection, error, lastOk, countdown, loading, newNames, refresh, tick,
    localSamples: history.samples, clearLocalHistory: history.clear,
  };
}
