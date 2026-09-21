# Skyknight Raven — host it yourself

This is the **knight side**. Do not deploy it over Peachfall
(`https://forest-mist-zest-civic.grok.me`).

## Play now

| Where | URL |
| --- | --- |
| Live | [skyknight-raven.vercel.app](https://skyknight-raven.vercel.app) |
| Source | [github.com/stevoblevo/skyknight-raven](https://github.com/stevoblevo/skyknight-raven) |
| GitHub Pages | [stevoblevo.github.io/skyknight-raven](https://stevoblevo.github.io/skyknight-raven/) |
| Container | `ghcr.io/stevoblevo/skyknight-raven:latest` |

## tower.local (Docker)

```bash
# /etc/hosts
127.0.0.1 tower.local

docker compose up --build -d
# open http://tower.local:8088
```

Or pull the published image:

```bash
docker pull ghcr.io/stevoblevo/skyknight-raven:latest
docker compose up -d
```

Stop: `docker compose down`

The image listens on **8088** so it never collides with Peachfall or Grok preview (8080).

`.github/workflows/container.yml` builds and pushes to GHCR on every `main` push.

## GitHub Pages

Push to `main`. `.github/workflows/pages.yml` builds a static SPA with
`VITE_BASE=/skyknight-raven/` and deploys it. The workflow turns Pages on
(`configure-pages` enablement) so the first deploy can succeed.

If a run still 404s on “create deployment”, open
[Settings → Pages](https://github.com/stevoblevo/skyknight-raven/settings/pages)
and set **Source: GitHub Actions**, then re-run the workflow.

## Vercel

Framework: **TanStack Start**. Build: `npm run build`. Env: `VITE_AUTH_ENABLED=false`.
Nitro preset stays `vercel` unless you set `NITRO_PRESET`.
GitHub is already linked; pushes to `main` ship to [skyknight-raven.vercel.app](https://skyknight-raven.vercel.app).
