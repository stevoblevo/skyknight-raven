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
`VITE_BASE=/skyknight-raven/` and deploys it.

GitHub will not let Actions turn Pages on by itself. One click, once:

1. Open [Settings → Pages](https://github.com/stevoblevo/skyknight-raven/settings/pages)
2. **Source: GitHub Actions**
3. Re-run the **GitHub Pages** workflow (or push again)

Until that is on, the live game is [skyknight-raven.vercel.app](https://skyknight-raven.vercel.app).

## Container visibility

The image publishes on every `main` push. First time, make it pullable without login:

1. Open [the package](https://github.com/stevoblevo/skyknight-raven/pkgs/container/skyknight-raven)
2. Package settings → Change visibility → **Public**

## Vercel

Framework: **TanStack Start**. Build: `npm run build`. Env: `VITE_AUTH_ENABLED=false`.
Nitro preset stays `vercel` unless you set `NITRO_PRESET`.
GitHub is already linked; pushes to `main` ship to [skyknight-raven.vercel.app](https://skyknight-raven.vercel.app).
