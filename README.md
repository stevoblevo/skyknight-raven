# Skyknight Raven

Oasis Dream — the knight side of the same story as Peachfall.
Meet Sae’s fragments. Do not collect them. Watch the play, or walk it.

**Play now:** [skyknight-raven.vercel.app](https://skyknight-raven.vercel.app)

Princess tower (Peachfall) stays at [forest-mist-zest-civic.grok.me](https://forest-mist-zest-civic.grok.me). This repo is a separate game.

## Controls

WASD or arrows walk · drag / right stick look · **Sit · Kneel · Hop · Gaze**

Same meadow on phone and desktop. Pose buttons stay on screen.

## Run it

```bash
npm install
npm run dev          # http://0.0.0.0:8080
```

## Container (tower.local)

Image: [`ghcr.io/stevoblevo/skyknight-raven`](https://github.com/stevoblevo/skyknight-raven/pkgs/container/skyknight-raven)

```bash
# /etc/hosts
127.0.0.1 tower.local

docker compose up --build -d
# open http://tower.local:8088
```

Pull instead of building:

```bash
docker compose pull
docker compose up -d
```

See [HOSTING.md](HOSTING.md) for Pages, Vercel, and the image.
