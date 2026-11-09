/**
 * Contract for GET {PULSE_API_URL}/api/status.
 * All scalars are strings — parse numbers with `num()` from ./format.
 */
export type Container = { name: string; status: string; image: string; health: string };

export type AlertLevel = "info" | "warning" | "error";
export type Alert = { time: string; level: AlertLevel; message: string };

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
};

/** One point of locally collected usage history. */
export type Sample = { t: number; cpu: number | null; ram: number | null; disk: number | null };
export type MetricKey = "cpu" | "ram" | "disk";
