# Configuration

All build-time configuration lives in the two environment files under
`src/environments/`. There is no runtime config endpoint — everything the client
needs (API base URL, ICE servers, TURN credential) is compiled into the JS bundle.

- Related: [development.md](./development.md) · [deployment.md](./deployment.md)
- TURN / admin secret placement (full stack):
  [`../../gvoice-server/docs/deployment.md`](../../gvoice-server/docs/deployment.md) §3 "Credentials"

---

## 1. The two environment files

| File | Used by | `rootUrl` | TURN credential |
|---|---|---|---|
| `src/environments/environment.development.ts` | `ng serve`, `ng build --configuration development`, **all unit tests** | `http://localhost:5293` | pasted locally by the dev |
| `src/environments/environment.ts` | **production build only** (`ng build`) | `/api` | injected at build time (see §4) |

### Why services import the *development* file

Every service imports the dev file **directly**:

```ts
import { environment } from '../../../environments/environment.development';
```

The production build then rewrites that import target via `fileReplacements`
(§3). This is deliberate but easy to trip over:

> **Change the *shape* of the config in BOTH files.** If you add or rename a field
> in `environment.development.ts` but forget `environment.ts`, dev works and the
> **production build breaks** (or ships stale values). They must stay structurally
> identical; only the *values* differ.

### Current contents

```ts
// environment.development.ts (dev)
export const environment = {
  production: false,
  rootUrl: 'http://localhost:5293',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:voice-room.ru:3478?transport=udp', username: 'webrtcuser', credential: 'paste_here' },
    { urls: 'turn:voice-room.ru:3478?transport=tcp', username: 'webrtcuser', credential: 'paste_here' },
  ],
};
```

```ts
// environment.ts (prod)
export const environment = {
  production: true,
  rootUrl: '/api',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:voice-room.ru:3478?transport=udp', username: 'webrtcuser', credential: '' },   // ← filled at build time
    { urls: 'turn:voice-room.ru:3478?transport=tcp', username: 'webrtcuser', credential: '' },   // ← filled at build time
  ],
};
```

---

## 2. `rootUrl`

`rootUrl` is the base for **both** the REST API and the SignalR hub:

| Consumer | URL built |
|---|---|
| Room list | `${rootUrl}/rooms` |
| Room participants | `${rootUrl}/rooms/:roomId/participants` |
| Admin verify | `${rootUrl}/admin/verify` |
| SignalR hub | `${rootUrl}/hub/signaling` |

- **Dev**: `http://localhost:5293` — the client talks to the backend cross-origin
  (CORS is configured server-side to allow `http://localhost:4200`).
- **Prod**: `/api` — same-origin, behind Caddy, which strips the `/api` prefix and
  forwards to the ASP.NET hub. The `/api` prefix strip is **mandatory**; without
  it the hub 404s. See the server deployment guide, "Known deployment gotchas".

---

## 3. `iceServers` and `fileReplacements`

`iceServers` is passed straight into `RTCPeerConnection`:

```ts
// webrtc.service.ts
private iceServers: RTCConfiguration = {
  iceServers: environment.iceServers,
  iceCandidatePoolSize: 10,
};
```

- **STUN** (`stun.l.google.com:19302`) covers most peers behind ordinary NAT.
- **TURN** (`voice-room.ru:3478`, UDP + TCP) relays media for peers behind
  symmetric / CGNAT that can't establish a direct path. TURN **requires valid
  credentials** — an empty `credential` silently breaks relay for exactly those
  users.

The `fileReplacements` swap in `angular.json` is what selects prod vs dev config:

```jsonc
// angular.json → projects.gvoice-client.architect.build.configurations.production
"fileReplacements": [
  { "replace": "src/environments/environment.development.ts",
    "with":    "src/environments/environment.ts" }
]
```

---

## 4. How the TURN credential is baked in at build time

This is the single most important operational detail — and a common source of
"relay doesn't work in prod":

**The TURN credential is compiled into the JS bundle at `ng build` time.** It is
**not** fetched from the server at runtime. `environment.ts` ships with an empty
`credential`, which is filled in during the build.

Because the client is **built on the server** (the Caddy Docker image runs
`ng build --configuration production` against the checked-out `client/`),
"setting the credential on the server" works — you edit
`client/src/environments/environment.ts` (or inject via a Docker build-arg) before
the image builds.

> Full mechanics, the exact table of where each secret goes, and the three
> injection options (runtime ICE endpoint / build-arg / edit-in-place) are
> documented once in
> [`../../gvoice-server/docs/deployment.md`](../../gvoice-server/docs/deployment.md)
> §3 "Credentials — where each one goes". **Do not duplicate that here** — it is
> the source of truth.

Consequence to remember: the credential must equal coturn's `user=` secret, and
if you ever ship a **pre-built** bundle instead of building on the server, an
empty/placeholder credential will pass STUN-only clients but break anyone needing
relay. The long-term fix (a backend endpoint returning short-lived ICE
credentials) is captured as an `[OPT]` in [code-review.md](./code-review.md) and
in the server guide.

---

## 5. Other client-side configuration (not in environment files)

These are hard-coded / persisted rather than environment-driven:

| Setting | Where | Notes |
|---|---|---|
| Themes | `theme.service.ts` (`THEMES`) + `localStorage['gvoice-theme']` | 8 built-in themes. |
| Audio prefs (PTT key, enhancements, noise-gate threshold, devices) | `settings.service.ts` + `localStorage` (`gvoice_*`) | Per-browser. |
| Per-participant volume | `localStorage['gv_vol_<displayName>']` | Keyed by display name (collision risk — see code-review). |
| Room passwords | `localStorage['gvoice_pwd_<roomId>']` | Plaintext (see code-review). |
| Admin password | `sessionStorage['gv_admin_pwd']` | Re-verified against the server on load. |
| SignalR message size / timeouts | `signalr.service.ts` | 10 MB max message (base64 image chat), 120 s server timeout, 15 s keep-alive. |
| Room capacity | enforced **server-side** (`RoomFull` event) | Client assumes ≤10. |
