# Skyknight Raven — knight side only.
# Peachfall (princess) stays on grok.me and is not this image.
FROM node:22-bookworm-slim AS build

WORKDIR /app
ENV VITE_AUTH_ENABLED=false
ENV NITRO_PRESET=node-server

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS run

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8088
ENV HOST=0.0.0.0
ENV VITE_AUTH_ENABLED=false

COPY --from=build --chown=node:node /app/.output ./.output
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/scripts/tower-serve.mjs ./scripts/tower-serve.mjs
COPY --from=build --chown=node:node /app/package.json ./package.json

USER node
EXPOSE 8088
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8088)).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

LABEL org.opencontainers.image.title="Skyknight Raven" \
  org.opencontainers.image.description="Oasis Dream knight side — meet the fragments." \
  org.opencontainers.image.source="https://github.com/stevoblevo/skyknight-raven" \
  org.opencontainers.image.url="https://skyknight-raven.vercel.app"

CMD ["node", "scripts/tower-serve.mjs"]
