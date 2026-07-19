# Deployment (client)

> **The full-stack deployment guide is the source of truth:**
> [`../../gvoice-server/docs/deployment.md`](../../gvoice-server/docs/deployment.md).
> It covers topology, the deploy-root layout, Caddy, coturn, secrets, the first
> deploy and redeploy. **This page only documents client-specific behaviour** and
> deliberately does not repeat any of it.

- Related: [configuration.md](./configuration.md) · [development.md](./development.md)

---

## 1. How the client ships

The client is **built on the server, inside the Caddy Docker image** — there is no
separate CI artifact or CDN upload. The Docker build context copies the
`client/` checkout, runs:

```
ng build --configuration production
```

and the resulting **`dist/gvoice-client/browser/`** bundle is served by Caddy as
static files from `/srv/www`. That is the only thing that reaches users.

```
client/  ──(docker build context)──▶  ng build --configuration production
                                              │
                                              ▼
                         dist/gvoice-client/browser/   ──▶  Caddy static (/srv/www)  ──▶  users
                         dist/gvoice-client/server/    ──▶  built, then discarded (unused)
```

Because the build happens on the server, the **build-time TURN credential**
(baked into the bundle) is set by editing `client/src/environments/environment.ts`
before the image builds — see [configuration.md](./configuration.md) §4 and the
server guide §3 "Credentials".

At this scale (**peak ≤10 users**) this is intentionally simple: one small VDS,
static hosting, no client-side CI.

---

## 2. What is served: the browser bundle only

`ng build` emits **two** directories (`angular.json` has `outputMode: static` plus
an `ssr.entry`):

| Output | Served in prod? | Notes |
|---|---|---|
| `dist/gvoice-client/browser/` | **Yes** — static via Caddy | The real app. Client-side rendered. |
| `dist/gvoice-client/server/` (`server.mjs`) | **No** | The SSR Express server. Built but never run in prod. |

### SSR is not used — you can switch to a pure static build

Every route is `RenderMode.Client` (`app.routes.server.ts`), so the SSR server
adds nothing at runtime beyond an app shell. It is harmless but wasted build time.
Removing SSR (drop `ssr` from `angular.json`, `server.ts`, `main.server.ts`,
`app.config.server.ts`, `app.routes.server.ts` and the `@angular/ssr` /
`@angular/platform-server` / `express` deps) would produce a cleaner, faster
static-only build with identical user-facing behaviour. Tracked as an `[OPT]` in
[code-review.md](./code-review.md). Until then, `browser/` is what matters.

---

## 3. Service worker behaviour

`src/service-worker.js` (registered from `main.ts` on load) is a small hand-written
PWA cache — **not** Angular's `@angular/service-worker`. Cache name `voiceroom-v3`.

Strategy:

| Request | Behaviour |
|---|---|
| WebSocket upgrades, `/api/*`, `*.js`, `*.mjs`, `*.css`, `*.wasm` | **Never intercepted** — straight to network. Critical: SignalR/WebSocket and hashed JS/CSS must not be cached or stale-served. |
| `navigate` (page loads) | **Network-first**, falling back to `caches.match('/index.html')` when offline. |
| Other static (`favicon.ico`, `manifest.webmanifest`) | **Cache-first**, network fallback. Only `manifest.webmanifest` and `favicon.ico` are precached on `install`. |

`install` calls `skipWaiting()` and `activate` deletes old caches + `clients.claim()`,
so a new deploy takes over immediately (no "close all tabs" dance). Because all
hashed assets bypass the SW, a redeploy is picked up on the next navigation.

> **Known caveat:** the navigate fallback references `caches.match('/index.html')`,
> but `/index.html` is **not** in the precache list — so an actual offline load
> resolves to `undefined` and the fallback does nothing. Either precache
> `index.html` on install or drop the fallback. Tracked as `[OPT]` in
> [code-review.md](./code-review.md).

If you change caching strategy, bump `CACHE_NAME` (e.g. `voiceroom-v4`) so the
`activate` handler purges the old cache.

---

## 4. Secure-context requirement

`getUserMedia`, `getDisplayMedia` and WebSocket all require a **secure context**.
In production that means TLS must terminate at Caddy (HTTPS is mandatory, not
optional). In development `http://localhost` already counts as secure, so no
local certs are needed. This is a hosting concern owned entirely by the
[server deployment guide](../../gvoice-server/docs/deployment.md).

---

## 5. Client redeploy checklist

The mechanics (`git pull`, `docker compose up -d --build`) live in the server
guide §5. Client-specific things to verify after a redeploy:

- [ ] `environment.ts` still has the correct **TURN credential** (it is not in git
      history intentionally — re-check after a fresh clone).
- [ ] Lobby loads and lists rooms → confirms `rootUrl: /api` + Caddy prefix strip.
- [ ] A peer behind CGNAT/mobile connects → confirms the baked-in TURN credential
      works (`chrome://webrtc-internals` shows a `relay` candidate pair).
- [ ] Hard-reload picks up the new bundle (SW bypasses hashed assets, so this
      should "just work"); if you changed `service-worker.js`, confirm the new
      `CACHE_NAME` took effect.
