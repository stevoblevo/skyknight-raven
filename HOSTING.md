# Skyknight Raven — host it yourself

This is the **knight side**. Do not deploy it over Peachfall
(`https://forest-mist-zest-civic.grok.me`).

## tower.local (Docker)

```bash
# /etc/hosts
127.0.0.1 tower.local

docker compose up --build -d
# open http://tower.local:8088
```

Stop: `docker compose down`

## Vercel

Repo: push this tree, then import `skyknight-raven` on Vercel (framework: Vite / TanStack Start). Build command is `npm run build`.

## GitHub Pages

This app is SSR (TanStack Start + Nitro). GitHub Pages is static-only, so it is a poor fit. Use Vercel or the Docker image instead.
