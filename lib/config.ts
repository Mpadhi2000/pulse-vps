/**
 * Where the Pulse API (on the VPS) can be reached, in order of preference.
 *
 * The dashboard is hosted on Vercel. Depending on DNS, the API answers on its own host
 * (pulse-api.mayankpadhi.in) or still on pulse.mayankpadhi.in. The client tries each
 * origin and sticks with the first one that returns JSON (see lib/api.ts).
 *
 * PULSE_API_URL (build time, comma-separated) overrides the list — set it in
 * Vercel → Project → Settings → Environment Variables.
 */
export const API_ORIGINS: string[] = (process.env.PULSE_API_URL || "https://pulse-api.mayankpadhi.in,https://pulse.mayankpadhi.in")
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

/** Public name of the dashboard (shown in the header). */
export const SITE_HOST = "pulse.mayankpadhi.in";

export const REFRESH_INTERVAL_S = 15;
export const TIMEOUT_MS = 10_000;

/**
 * Fallback only: if /api/history is unreachable, history collected in the
 * browser is used instead (kept in localStorage for this long).
 */
export const HISTORY_MAX_MS = 24 * 60 * 60 * 1000;
export const HISTORY_STORAGE_KEY = "pulse:history:v1";
