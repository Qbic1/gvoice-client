# Build Angular
FROM node:22-alpine AS build
WORKDIR /client

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# Caddy runtime
FROM caddy:latest

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /client/dist/gvoice-client/browser /srv/www