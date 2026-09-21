# Skyknight Raven — run on tower.local (or any Docker host).
# Peachfall on grok.me is a different app; this image is the knight side only.
FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production
ENV VITE_AUTH_ENABLED=false

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 8088
ENV PORT=8088
CMD ["node", "scripts/tower-serve.mjs"]
