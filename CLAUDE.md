# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`gvoice-client` is the Angular 21 frontend for a Discord-style voice-chat app: full-mesh WebRTC P2P audio between participants in a room, with a separate backend (not in this repo) providing SignalR signaling and a REST API. The client also handles screen sharing, text chat, push-to-talk, and per-participant volume.

## Commands

```bash
ng serve                 # dev server on http://localhost:4200 (needs backend on :5293)
ng build                 # production build → dist/ (SSR + static browser bundle)
ng test                  # unit tests (Vitest) — headless, all *.spec.ts under src/
npx vitest run src/app/core/services/participant.service.spec.ts   # single unit test file
npm run serve:ssr:gvoice-client                                    # run the built SSR server (dist/.../server.mjs)
```

E2E tests (Playwright, in `tests/`) — these are **integration** tests that require both the dev server on :4200 **and** the backend running:

```bash
npx playwright test                              # all e2e specs
npx playwright test tests/task4-reconnect.spec.ts   # single spec
npx playwright test -g "Should reconnect"        # by test name
```

Playwright runs `workers: 1` / `fullyParallel: false` on purpose — the backend holds room state in-memory, so parallel specs would race. Chromium launches with fake-media-stream flags so `getUserMedia` returns a synthetic mic. `ng e2e` is not wired up; use `npx playwright test` directly.

## Environment config — important gotcha

All services import from `environments/environment.development` **directly** (not the barrel `environment`). The production build config in `angular.json` does a `fileReplacements` that overwrites `environment.development.ts` **with** `environment.ts` at build time. So:

- `environment.development.ts` = dev values (`rootUrl: http://localhost:5293`, TURN creds you paste locally).
- `environment.ts` = prod values (`rootUrl: /api`) — used in production builds only.
- When editing config shape, change **both** files or the prod build breaks.

`rootUrl` is the base for REST (`/rooms`, `/rooms/:id/participants`) and the SignalR hub (`/hub/signaling`). `iceServers` (STUN + TURN) is passed straight into `RTCPeerConnection`.

## Architecture

**Rendering.** Angular standalone components + signals throughout (no NgModules, no NgRx). SSR is configured (`src/server.ts` Express + `@angular/ssr`) but every route renders client-side (`app.routes.server.ts` → `RenderMode.Client`). Services guard browser-only APIs with `isPlatformBrowser(PLATFORM_ID)` because they instantiate during SSR. `ThemeService.init()` runs via `APP_INITIALIZER` before first paint.

**Routing** (`app.config.ts`): `''` → `LobbyComponent` (room list / create), `room/:roomId` → `App` (the in-room shell). `App` switches its own UI on `signalrService.connectionStatus` (`Disconnected`→join form, `Connecting`→loader, `Connected`/`Reconnecting`→desktop/mobile layout, `Error`→disconnect overlay showing `disconnectReason()`). `Reconnecting` deliberately keeps the room mounted — only a banner is added — so a transient drop does not destroy the in-memory chat or bounce the user to the password form. `LayoutService.isMobile` picks desktop vs mobile layout.

**Signaling — `SignalRService`.** Single source of truth for the server connection. Wraps `@microsoft/signalr` with `withAutomaticReconnect()`, exposes RxJS Subjects for every server event (`peerJoined$`, `receiveSignal$`, `peerLeft$`, `peerStateUpdated$`, chat, room lifecycle) and signals for `connectionStatus` / `connectionId`. All outbound calls (`joinRoom`, `sendSignal`, `updateState`, chat) are guarded by connection state — they silently no-op while the hub is down, so any UI left interactive during a reconnect must disable itself (the chat composer does).

**Reconnect path.** `onreconnecting` → status `Reconnecting`. `onreconnected` → new `connectionId`, `reconnected$` (WebRTC drops the stale mesh), then an automatic re-`Join` replaying `lastJoin`. Its `RoomJoined` reply restores `Connected` and fires `roomRejoined$`, which is where `WebRtcService` re-broadcasts `muted`/`deafened`/`sharingScreen` — the server registers a rejoining peer with **default** state. A rejection of that re-`Join` (`RoomNotFound` after a server restart, `InvalidPassword`, `RoomFull`) is terminal, not input for the join form, which is unmounted at that point: it goes through `fail(reason)` → `Error` + `disconnectReason`. Keep `disconnect()` (user left) and `fail()` (session died) separate — `onclose` calling both is what used to make the disconnect overlay unreachable.

**WebRTC — `WebRtcService`.** The core. Maintains a mesh: one `RTCPeerConnection` per remote peer in `peerConnections`. Reacts to `SignalRService` streams — `peerJoined$` creates a connection, `receiveSignal$` feeds `handleSignal`, `peerLeft$` tears down. Uses the **Perfect Negotiation** pattern: politeness is decided by lexicographic compare of connection IDs (`isPolite`), offer collisions tracked via `makingOffer`/`ignoreOffer`, and ICE candidates arriving before the remote description are buffered in `iceCandidatesQueue`. The **processed** local stream (see audio pipeline) is what gets added to peers, not the raw mic; a callback from `AudioProcessorService` calls `replaceTracksInAllPeerConnections` when the graph rebuilds. Screen-share tracks are added/removed on top of the audio connection and renegotiated. Mute/deafen/PTT are signal-driven and broadcast to peers via `updateState`.

**Audio pipeline — `AudioProcessorService`.** Owns the single shared `AudioContext`. Local mic chain: `getUserMedia` → source → high-pass filter → compressor → noise-gate AudioWorklet → analyser → `MediaStreamDestination` → the track sent to peers. Remote chain: incoming stream → high-pass → gain node (per-participant volume / deafen) → destination + a hidden `<audio>` element. Enhancement toggles and noise-gate threshold are reactive via an `effect()` on `SettingsService`. The two worklets live in `public/` and are served at absolute paths: `audio-worklet.js` (`noise-gate-processor`) and `vad-worklet.js` (`vad-processor`, drives speaking indicators). `ensureWorkletLoaded()` must be awaited after `getUserMedia` (so the context isn't suspended) before building the graph. `AudioContext` resume-on-interaction listeners are sprinkled across services to satisfy browser autoplay policy.

**Supporting services** (`core/services/`): `ParticipantService` (roster + speaking/volume state as signals), `SettingsService` (device selection, audio-enhancement prefs, PTT key — persisted to localStorage), `ChimesService` (join/leave/screen-share sound cues), `AudioAnalysisService` (mic level meter for the settings screen), `AdminService` (admin-password gated room management), `DisplayNameService`, `ThemeService`, `IconService`, `LayoutService`.

**Feature components** (`features/`): `room/` (lobby, join form, participant cards/list, screen-share overlay), `layout/` (desktop vs mobile shells), `controls/` (voice controls bar), `chat/`, `settings/`.

## Conventions

- New services/components are `standalone` and use `inject()` + signals rather than constructor DI and observables-in-templates where practical.
- Any code touching `window`, `document`, `navigator`, or `AudioContext` must be behind an `isBrowser` check or it will throw during SSR.
- The mesh assumes ≤10 participants (room capacity enforced server-side; `RoomFull` event).
