/** Origin of the Pulse API. Override at build time with PULSE_API_URL (see next.config.ts). */
export const PULSE_API_URL = (process.env.PULSE_API_URL || "https://pulse.mayankpadhi.in").replace(/\/+$/, "");
export const STATUS_ENDPOINT = `${PULSE_API_URL}/api/status`;

export const REFRESH_INTERVAL_S = 15;
export const TIMEOUT_MS = 10_000;

/** How much locally collected history to keep (and the longest chart range). */
export const HISTORY_MAX_MS = 24 * 60 * 60 * 1000;
export const HISTORY_STORAGE_KEY = "pulse:history:v1";
