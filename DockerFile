# ── Build stage ──────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
 
COPY package*.json ./
RUN npm ci
 
COPY . .
RUN npm run build -- --configuration production
 
# ── Output stage ─────────────────────────────────────────────
# Copy compiled dist to a shared volume for Caddy to serve
FROM alpine:3.20
COPY --from=build /app/dist/gvoice-client/browser /srv/www
# Container exits after copying — Caddy picks up the files
CMD ["echo", "Client build complete"]
