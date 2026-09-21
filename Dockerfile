# Skyknight Raven — knight side only. Peachfall on grok.me is a different app.
FROM node:22-bookworm-slim

WORKDIR /app
ENV VITE_AUTH_ENABLED=false
ENV NITRO_PRESET=node-server

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8088
EXPOSE 8088
CMD ["node", "scripts/tower-serve.mjs"]
