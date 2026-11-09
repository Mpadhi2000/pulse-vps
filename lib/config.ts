/** Endpoint the dashboard polls. Override at build time with NEXT_PUBLIC_API_URL. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://pulse.mayankpadhi.in/api/status";
export const REFRESH_INTERVAL_S = 30;
export const TIMEOUT_MS = 10_000;
