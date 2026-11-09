"use client";

import { useEffect, useRef, useState } from "react";
import type { HistoryRange, HistoryResponse, Sample } from "./types";
import { getJson } from "./api";

export type HistorySource = "server" | "local";

const toNum = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

type Parsed = { samples: Sample[]; intervalS: number | null };

/**
 * Several components can ask for the same range on the same poll (e.g. the chart and the
 * sparklines both use 1h). Share one request per range+tick instead of fetching twice.
 */
const inflight = new Map<string, Promise<Parsed>>();

function fetchHistory(range: HistoryRange, tick: number): Promise<Parsed> {
  const key = `${range}:${tick}`;
  const hit = inflight.get(key);
  if (hit) return hit;
  const p = (async () => {
    try {
      const body = await getJson<HistoryResponse>(`/api/history?range=${range}`);
      if (!Array.isArray(body.samples)) throw new Error("Malformed history response");
      const samples: Sample[] = body.samples
        .map((s) => ({ t: Date.parse(s.t), cpu: toNum(s.cpu), ram: toNum(s.ram), disk: toNum(s.disk) }))
        .filter((s) => Number.isFinite(s.t))
        .sort((a, b) => a.t - b.t);
      return { samples, intervalS: typeof body.interval_s === "number" && body.interval_s > 0 ? body.interval_s : null };
    } finally {
      // Keep the entry briefly so a sibling effect in the same render pass can reuse it.
      setTimeout(() => inflight.delete(key), 1000);
    }
  })();
  inflight.set(key, p);
  return p;
}

/**
 * Usage history from GET /api/history?range=…, re-fetched whenever `tick` changes
 * (i.e. after every successful status poll) or the range changes.
 * `ok` is false when the endpoint can't be reached, so callers can fall back to local history.
 */
export function useServerHistory(range: HistoryRange, tick: number) {
  const [samples, setSamples] = useState<Sample[] | null>(null);
  const [intervalS, setIntervalS] = useState(15);
  const [ok, setOk] = useState<boolean | null>(null);
  const reqId = useRef(0);

  // Clear the previous range's data immediately so the chart doesn't show the wrong span.
  useEffect(() => { setSamples(null); }, [range]);

  useEffect(() => {
    const id = ++reqId.current;
    fetchHistory(range, tick)
      .then((r) => {
        if (id !== reqId.current) return; // superseded by a newer range/tick
        setSamples(r.samples);
        if (r.intervalS) setIntervalS(r.intervalS);
        setOk(true);
      })
      .catch(() => {
        if (id === reqId.current) setOk(false);
      });
  }, [range, tick]);

  return { samples, intervalS, ok };
}
