import { API_ORIGINS, TIMEOUT_MS } from "./config";

/** Index into API_ORIGINS of the origin that last answered correctly. */
let active = 0;

export const activeOrigin = () => API_ORIGINS[active] ?? API_ORIGINS[0];
export const activeHost = () => activeOrigin().replace(/^https?:\/\//, "");

/**
 * GET a JSON endpoint of the Pulse API (e.g. "/api/status").
 * Tries the last working origin first, then the others; an origin only counts as working
 * if it answers 2xx with a JSON body (a Vercel 404 page or a redirect does not).
 */
export async function getJson<T>(path: string): Promise<T> {
  const order = [active, ...API_ORIGINS.map((_, i) => i).filter((i) => i !== active)];
  let lastErr: unknown = new Error("No API origin configured");
  for (const i of order) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${API_ORIGINS[i]}${path}`, {
        cache: "no-store",
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!(res.headers.get("content-type") || "").includes("json")) throw new Error("Not a JSON response");
      const body = (await res.json()) as T;
      active = i;
      return body;
    } catch (e) {
      const err = e as Error;
      lastErr = err.name === "AbortError" ? new Error("Request timed out") : err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}
