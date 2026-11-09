# Pulse · VPS Status

Live status dashboard for the `pulse.mayankpadhi.in` VPS, built with **Next.js (App Router) + TypeScript**.
Monochrome black/white theme inspired by nextjs.org (Geist font, hairline grid, light/dark/system toggle).

- **Overview** — CPU, memory, disk (with 30-min sparklines), uptime, nginx, container count
- **Usage graph** — CPU / memory / disk over 15m · 1h · 6h · 24h · 7d from `/api/history`, hover tooltips, current/avg/peak
- **Workloads** — Docker containers with up/health state and image tag
- **Health** — failed systemd services, recent alerts, backup status
- Status pill shows *Operational*, *Degraded* (failed services, `error` alerts, nginx down, stopped
  containers, or a status snapshot older than 2 min) or *Offline*
- Times are shown in 12-hour format in the viewer's local time zone

## API

No auth, CORS `*`, `Cache-Control: no-store`. Types live in [`lib/types.ts`](lib/types.ts).

| Endpoint | Used for |
| --- | --- |
| `GET /api/status` | Current snapshot. The app prefers the v2 fields (`metrics`, `*_iso` timestamps, `failed_services_list`, ISO `last_backup`) and falls back to the legacy string fields. |
| `GET /api/history?range=15m\|1h\|6h\|24h\|7d` | Usage graph and sparklines (server samples every 15 s, ≤ ~600 points per response). |

If `/api/history` is unreachable the app falls back to samples collected in the browser
(`localStorage`, up to 24 h).

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in ./out
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PULSE_API_URL` | `https://pulse.mayankpadhi.in` | Origin of the Pulse API; the app polls `${PULSE_API_URL}/api/status`. Inlined at build time. |
| `NEXT_PUBLIC_BASE_PATH` | `""` | Sub-path the site is served from (e.g. `/pulse-vps` on GitHub Pages). Set automatically by the deploy workflow. |

## Deploy to GitHub Pages

1. Repo **Settings → Pages → Build and deployment → Source** → **GitHub Actions**.
2. Push to `main` (or run **Deploy to GitHub Pages** from the Actions tab).
3. Site: `https://mpadhi2000.github.io/pulse-vps/`.

## Deploy on the VPS (nginx)

```bash
npm run build
rsync -a --delete out/ /var/www/pulse/
```

## Structure

```
app/                 layout (Geist fonts, theme script), page, global styles
components/          Dashboard, StatGrid, UsageChart, Sparkline, ContainersTable,
                     LowerPanels, ThemeToggle, Icons, Badge
lib/                 usePulse (polling), useHistory (localStorage), series (bucketing/stats),
                     format helpers, API types, config
.github/workflows/   GitHub Pages CI/CD
```
