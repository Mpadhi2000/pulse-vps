"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StatusResponse } from "./types";
import { API_URL, REFRESH_INTERVAL_S, TIMEOUT_MS } from "./config";

export type LiveState = "wait" | "live" | "down";

/** Polls the status API every REFRESH_INTERVAL_S seconds, with timeout, countdown and manual refresh. */
export function usePulse() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [state, setState] = useState<LiveState>("wait");
  const [error, setError] = useState<string | null>(null);
  const [lastOk, setLastOk] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_S);
  const [loading, setLoading] = useState(false);
  const [newNames, setNewNames] = useState<Set<string>>(new Set());

  const known = useRef<Set<string> | null>(null);
  const inFlight = useRef(false);
  const lastOkRef = useRef<Date | null>(null);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(API_URL, {
        cache: "no-store",
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = (await res.json()) as StatusResponse;

      // Highlight containers that appeared since the previous poll (not on first load).
      const names = new Set((d.containers ?? []).map((c) => String(c.name || "unnamed")));
      const prev = known.current;
      setNewNames(prev ? new Set([...names].filter((n) => !prev.has(n))) : new Set());
      known.current = names;

      const now = new Date();
      lastOkRef.current = now;
      setData(d);
      setLastOk(now);
      setError(null);
      setState("live");
    } catch (e) {
      const err = e as Error;
      setError(err.name === "AbortError" ? "Request timed out" : err.message);
      setState("down");
    } finally {
      clearTimeout(t);
      inFlight.current = false;
      setLoading(false);
      setCountdown(REFRESH_INTERVAL_S);
    }
  }, []);

  // Initial load
  useEffect(() => { void refresh(); }, [refresh]);

  // 1s ticker driving the countdown
  useEffect(() => {
    const id = setInterval(() => setCountdown((c) => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (countdown === 0) void refresh();
  }, [countdown, refresh]);

  // Refresh immediately when the tab becomes visible again with stale data
  useEffect(() => {
    const onVis = () => {
      const ok = lastOkRef.current;
      if (!document.hidden && ok && Date.now() - ok.getTime() > REFRESH_INTERVAL_S * 1000) void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  return { data, state, error, lastOk, countdown, loading, newNames, refresh };
}
