/**
 * Origin of the Pulse API on the VPS. It must NOT be the dashboard's own domain:
 * pulse.mayankpadhi.in is served by Vercel, so the API lives on its own host.
 * Override at build time with PULSE_API_URL (Vercel → Project → Environment Variables).
 */
export const PULSE_API_URL = (process.env.PULSE_API_URL || "https://pulse-api.mayankpadhi.in").replace(/\/+$/, "");

/** Public name of the dashboard (shown in the header). */
export const SITE_HOST = "pulse.mayankpadhi.in";
export const STATUS_ENDPOINT = `${PULSE_API_URL}/api/status`;
export const HISTORY_ENDPOINT = `${PULSE_API_URL}/api/history`;

export const REFRESH_INTERVAL_S = 15;
export const TIMEOUT_MS = 10_000;

/**
 * Fallback only: if /api/history is unreachable, history collected in the
 * browser is used instead (kept in localStorage for this long).
 */
export const HISTORY_MAX_MS = 24 * 60 * 60 * 1000;
export const HISTORY_STORAGE_KEY = "pulse:history:v1";
