# Skyknight Raven — host it yourself

This is the **knight side**. Do not deploy it over Peachfall
(`https://forest-mist-zest-civic.grok.me`).

## Play now

- Source: [github.com/stevoblevo/skyknight-raven](https://github.com/stevoblevo/skyknight-raven)
- GitHub Pages: [stevoblevo.github.io/skyknight-raven](https://stevoblevo.github.io/skyknight-raven/)
- Vercel (skein): import the repo at [vercel.com/new](https://vercel.com/new/git/external?repository-url=https://github.com/stevoblevo/skyknight-raven)  
  (Vercel’s GitHub App must be allowed on this repo — until then Pages is the public URL.)

## tower.local (Docker)

```bash
# /etc/hosts
127.0.0.1 tower.local

docker compose up --build -d
# open http://tower.local:8088
```

Stop: `docker compose down`

Image listens on **8088** so it never collides with Peachfall or Grok preview (8080).

## GitHub Pages

Push to `main`. `.github/workflows/pages.yml` builds a static SPA with
`VITE_BASE=/skyknight-raven/` and deploys it.

## Vercel

Framework: **TanStack Start**. Build: `npm run build`. Env: `VITE_AUTH_ENABLED=false`.
Nitro preset stays `vercel` unless you set `NITRO_PRESET`.
