/** Shape of the JSON returned by the VPS `/api/status` endpoint. Most values arrive as strings. */
export type Scalar = string | number | null | undefined;

export interface Container {
  name?: string;
  status?: string;
  image?: string;
  health?: string;
}

export interface FailedService {
  name: string;
  severity?: string;
  since?: string;
}

export interface Alert {
  time?: string;
  timestamp?: string;
  level?: string;
  severity?: string;
  message?: string;
  title?: string;
}

export interface StatusResponse {
  time?: string;
  cpu?: Scalar;
  cpu_cores?: Scalar;
  load_avg?: string | number[];
  ram_pct?: Scalar;
  ram_used_gb?: Scalar;
  ram_total_gb?: Scalar;
  disk_pct?: Scalar;
  disk_used?: Scalar;
  disk_total?: Scalar;
  uptime?: string;
  boot_time?: string;
  nginx?: string;
  nginx_config_test?: Scalar;
  nginx_test?: Scalar;
  containers?: Container[];
  running_count?: Scalar;
  total_count?: Scalar;
  failed_services?: string | (string | FailedService)[];
  alerts?: Alert[];
  last_backup?: string;
  backup_status?: string;
  backup_size?: Scalar;
  backup_upload?: Scalar;
  upload_status?: Scalar;
}
