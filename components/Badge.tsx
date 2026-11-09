import type { ReactNode } from "react";

export type Tone = "ok" | "crit" | "warn" | "info" | "neutral";

export function Badge({ tone = "neutral", dot, lg, children }: { tone?: Tone; dot?: boolean; lg?: boolean; children: ReactNode }) {
  return <span className={`badge ${tone}${dot ? " dotted" : ""}${lg ? " lg" : ""}`}>{children}</span>;
}
