# Pulse · VPS Status

Live status dashboard for the `pulse.mayankpadhi.in` VPS, built with **Next.js (App Router) + TypeScript**.
It polls `/api/status` every 30 s and shows CPU, memory, disk, uptime, nginx, Docker containers,
failed systemd services, recent alerts and backup state.

The app is exported as a fully static site (`output: "export"`), so it can be hosted on
GitHub Pages, behind nginx on the VPS, or on any static host.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in ./out
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://pulse.mayankpadhi.in/api/status` | Endpoint the dashboard polls. The API sends `Access-Control-Allow-Origin: *`, so it works cross-origin. Use `/api/status` when serving from the VPS itself. |
| `NEXT_PUBLIC_BASE_PATH` | `""` | Sub-path the site is served from (e.g. `/pulse-vps` on GitHub Pages). Set automatically by the deploy workflow. |

## Deploy to GitHub Pages

1. In the repo go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
2. Push to `main` (or run the **Deploy to GitHub Pages** workflow manually from the Actions tab).
3. The site is published at `https://<user>.github.io/pulse-vps/`.

## Deploy on the VPS (nginx)

```bash
NEXT_PUBLIC_API_URL=/api/status npm run build
rsync -a --delete out/ /var/www/pulse/
```

## Structure

```
app/            layout, page, global styles
components/     Dashboard, MetricCards, ContainersTable, LowerPanels, Icons, Badge
lib/            usePulse (polling hook), format helpers, API types, config
.github/workflows/deploy.yml   GitHub Pages CI/CD
```
