# Pulse · VPS Status

Live status dashboard for the `pulse.mayankpadhi.in` VPS, built with **Next.js (App Router) + TypeScript**.
Monochrome black/white theme inspired by nextjs.org (Geist font, hairline grid, light/dark/system toggle).

- **Overview** — CPU, memory, disk (with 30-min sparklines), uptime, nginx, container count
- **Usage graph** — CPU / memory / disk over 15m · 1h · 6h · 24h, hover tooltips, current/avg/peak
- **Workloads** — Docker containers with up/health state and image tag
- **Health** — failed systemd services, recent alerts, backup status
- Status pill shows *Operational*, *Degraded* (failed services, `error` alerts, nginx down, stopped containers) or *Offline*

The API only returns the current reading, so usage **history is collected in the browser**
every 15 s and kept in `localStorage` for up to 24 h.

## API

`GET https://pulse.mayankpadhi.in/api/status` — no auth, CORS `*`, JSON. All scalars are strings.
Types live in [`lib/types.ts`](lib/types.ts).

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
