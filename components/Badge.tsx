import type { ReactNode } from "react";

export type Tone = "green" | "red" | "blue" | "amber" | "gray";

export function Badge({ tone, big, children }: { tone: Tone; big?: boolean; children: ReactNode }) {
  return <span className={`badge b-${tone}${big ? " big-badge" : ""}`}>{children}</span>;
}
