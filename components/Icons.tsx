import type { CSSProperties } from "react";

export type IconName =
  | "pulse" | "cpu" | "ram" | "disk" | "clock" | "globe" | "box" | "alert"
  | "bell" | "archive" | "check" | "wifi-off" | "refresh" | "x" | "info";

/** Inline SVG sprite — rendered once in the root layout. */
export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id="i-pulse" viewBox="0 0 24 24"><path d="M3 12h4l3-8 4 16 3-8h4" /></symbol>
        <symbol id="i-cpu" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="2" /><rect x="9" y="9" width="6" height="6" rx="1" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /></symbol>
        <symbol id="i-ram" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="2" /><path d="M6 11v2M10 11v2M14 11v2M18 11v2M5 17v3M19 17v3" /></symbol>
        <symbol id="i-disk" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></symbol>
        <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></symbol>
        <symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></symbol>
        <symbol id="i-box" viewBox="0 0 24 24"><path d="M21 8 12 3 3 8v8l9 5 9-5V8z" /><path d="m3 8 9 5 9-5M12 13v8" /></symbol>
        <symbol id="i-alert" viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></symbol>
        <symbol id="i-bell" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></symbol>
        <symbol id="i-archive" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="5" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4" /></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></symbol>
        <symbol id="i-wifi-off" viewBox="0 0 24 24"><path d="m2 2 20 20M8.5 16.5a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.8M19 12.9a10 10 0 0 0-2.3-1.6M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 10.7 5M12 20h.01" /></symbol>
        <symbol id="i-refresh" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.6-6.4L21 8" /><path d="M21 3v5h-5" /></symbol>
        <symbol id="i-x" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="m15 9-6 6M9 9l6 6" /></symbol>
        <symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></symbol>
      </defs>
    </svg>
  );
}

export function Icon({ name, size, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return (
    <svg className="i" style={size ? { width: size, height: size, ...style } : style} aria-hidden="true">
      <use href={`#i-${name}`} />
    </svg>
  );
}

/** Rounded tinted icon tile. `color` is any CSS colour / var(). */
export function IconTile({ name, color }: { name: IconName; color?: string }) {
  return (
    <div className="ic" style={color ? ({ "--c": color } as CSSProperties) : undefined}>
      <Icon name={name} />
    </div>
  );
}
