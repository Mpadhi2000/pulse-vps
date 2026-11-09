/**
 * Contract for GET {PULSE_API_URL}/api/status.
 * All scalars are strings — parse numbers with `num()` from ./format.
 */
export type Container = { name: string; status: string; image: string; health: string };

export type AlertLevel = "info" | "warning" | "error";
export type Alert = { time: string; time_iso?: string; level: AlertLevel; message: string };

export type PulseStatus = {
  time: string;
  cpu: string;
  cpu_cores: string;
  load_avg: string;
  ram_pct: string;
  ram_used_gb: string;
  ram_total_gb: string;
  disk_pct: string;
  disk_used: string;
  disk_total: string;
  uptime: string;
  boot_time: string;
  nginx: string;
  nginx_config_test: string;
  containers: Container[];
  running_count: string;
  total_count: string;
  failed_services: string;
  alerts: Alert[];
  last_backup: string;
  backup_status: string;
  backup_size: string;
  backup_upload: string;

  // v2 additions (all optional so older API versions still work)
  time_iso?: string;
  boot_time_iso?: string;
  failed_services_list?: string[];
  backup_size_bytes?: number;
  metrics?: Partial<Metrics>;
};

/** Typed copy of the scalar fields (API v2). */
export type Metrics = {
  cpu: number;
  cpu_cores: number;
  load_avg: number[];
  ram_pct: number;
  ram_used_gb: number;
  ram_total_gb: number;
  disk_pct: number;
  disk_used_gb: number;
  disk_total_gb: number;
  running_count: number;
  total_count: number;
};

export type HistoryRange = "15m" | "1h" | "6h" | "24h" | "7d";

/** GET /api/history?range=… */
export type HistoryResponse = {
  range: HistoryRange;
  interval_s: number;
  samples: { t: string; cpu: number | null; ram: number | null; disk: number | null }[];
};

/** One point of locally collected usage history. */
export type Sample = { t: number; cpu: number | null; ram: number | null; disk: number | null };
export type MetricKey = "cpu" | "ram" | "disk";
