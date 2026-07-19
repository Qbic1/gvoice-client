# GVoice Client — Documentation

`gvoice-client` is the **Angular 21** frontend for GVoice, a Discord-style group
voice chat. Participants in a room form a **full-mesh WebRTC P2P** network for
audio; a separate backend (`gvoice-server`, not in this repo) provides **SignalR**
signaling and a small REST API. On top of voice the client adds screen sharing,
text chat, push-to-talk (PTT), per-participant volume, themes and a settings /
audio-processing UI.

> Target scale: **peak ≤10 users** per room (capacity enforced server-side). The
> mesh, the in-memory server state and the single-worker e2e suite are all sized
> around that assumption.

## What this app does (at a glance)

- **Lobby** (`/`) — lists active rooms (REST + live `RoomCreated` updates),
  admin login, room creation (admin-gated), per-room participant popover.
- **Room** (`/room/:roomId`) — join form (name + room password + listen-only),
  then the in-room shell: participant cards/list, voice controls, chat,
  screen-share overlay, settings.
- **Audio pipeline** — a single shared `AudioContext` runs the local mic through
  HPF → compressor → noise-gate worklet → analyser before it is sent to peers,
  and runs each remote stream through an HPF + per-participant gain node. A
  second worklet (VAD) drives the speaking indicators.
- **Resilience** — SignalR auto-reconnect rebuilds the mesh and re-joins the room
  under the new connection id; dead mic tracks are re-acquired without a reload.

## Tech stack

| Area | Choice |
|---|---|
| Framework | Angular 21, **standalone components + signals** (no NgModules, no NgRx) |
| Signaling | `@microsoft/signalr` 10 over WebSocket |
| Media | Browser WebRTC (`RTCPeerConnection`, Perfect Negotiation), Web Audio API + `AudioWorklet` |
| Styling | **Tailwind CSS 4** (`@import "tailwindcss"` in `src/styles.css`) + CSS custom-property theme tokens |
| SSR shell | `@angular/ssr` + Express (`src/server.ts`) — configured but **all routes render client-side**, see [architecture.md](./architecture.md) |
| Unit tests | **Vitest** (`@angular/build:unit-test`, jsdom) |
| E2E tests | **Playwright** (`tests/`, real backend + dev server) |
| PWA | `manifest.webmanifest` + `src/service-worker.js` |

## Documentation index

| Doc | Contents |
|---|---|
| [architecture.md](./architecture.md) | Rendering model, routing, `SignalRService`, `WebRtcService` (mesh / Perfect Negotiation / screen share / PTT), `AudioProcessorService` + audio-graph ASCII diagram, supporting services. |
| [development.md](./development.md) | Prerequisites (**Node ≥22.12**), install, `ng serve`, build, worklet location, the environment-file gotcha, running unit + e2e tests. |
| [configuration.md](./configuration.md) | `environment.development.ts` vs `environment.ts`, `rootUrl`, `iceServers`, how the TURN credential is baked in at build time, `fileReplacements`. |
| [deployment.md](./deployment.md) | Client-specific deploy notes. Full stack deploy lives in [`../../gvoice-server/docs/deployment.md`](../../gvoice-server/docs/deployment.md). |
| [testing.md](./testing.md) | Current unit + e2e coverage and the gaps worth closing. |
| [code-review.md](./code-review.md) | Structured review: severity, file, status (FIXED/OPEN), issue, recommendation. |

## Quick start

```bash
node -v                      # must be >= 22.12 (required by Angular 21 CLI & Vitest)
npm ci
ng serve                     # http://localhost:4200 — needs the backend on :5293
```

See [development.md](./development.md) for the details, and the
[environment gotcha](./configuration.md) before you touch any config.

## Repo layout

```
src/
├── app/
│   ├── app.ts                 # in-room shell (App) — connection-status UI switch, PTT host listeners
│   ├── app.config.ts          # routes, providers, APP_INITIALIZER (ThemeService)
│   ├── app.config.server.ts   # SSR provider merge
│   ├── app.routes.server.ts   # every route → RenderMode.Client
│   ├── core/
│   │   ├── models/            # Participant, ChatMessage
│   │   └── services/          # signalr, webrtc, audio-processor, participant, settings, …
│   ├── features/
│   │   ├── room/              # lobby, join-room, participant card/list, screen-share overlay
│   │   ├── layout/            # desktop vs mobile shells
│   │   ├── controls/          # voice-controls bar
│   │   ├── chat/              # text chat + image paste
│   │   └── settings/          # settings modal (theme/audio/devices/controls)
│   └── shared/                # icons, linkify pipe
├── environments/              # environment.development.ts (dev) + environment.ts (prod)
├── server.ts                  # SSR Express entry (built, not used in prod)
├── service-worker.js          # PWA cache
└── main.ts / main.server.ts   # browser / server bootstrap
public/                        # static assets + AudioWorklets (audio-worklet.js, vad-worklet.js)
tests/                         # Playwright e2e specs (task*.spec.ts)
```
