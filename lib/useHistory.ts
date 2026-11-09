"use client";

import { useCallback, useEffect, useState } from "react";
import type { Sample } from "./types";
import { HISTORY_MAX_MS, HISTORY_STORAGE_KEY } from "./config";

function load(): Sample[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as Sample[]) : [];
    const cutoff = Date.now() - HISTORY_MAX_MS;
    return Array.isArray(arr) ? arr.filter((s) => s && typeof s.t === "number" && s.t >= cutoff) : [];
  } catch {
    return [];
  }
}

function save(samples: Sample[]) {
  try { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(samples)); } catch { /* storage full / blocked */ }
}

/**
 * The API only reports the current reading, so usage history is collected
 * in the browser and persisted to localStorage (up to HISTORY_MAX_MS).
 */
export function useHistory() {
  const [samples, setSamples] = useState<Sample[]>([]);

  useEffect(() => { setSamples(load()); }, []);

  const push = useCallback((s: Sample) => {
    setSamples((prev) => {
      const cutoff = s.t - HISTORY_MAX_MS;
      const next = [...prev.filter((p) => p.t >= cutoff && p.t < s.t), s];
      save(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSamples([]);
    try { localStorage.removeItem(HISTORY_STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  return { samples, push, clear };
}
