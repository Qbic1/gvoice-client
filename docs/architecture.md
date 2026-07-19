# Architecture

This document describes how the GVoice client is put together: the rendering
model, routing, the three core services (`SignalRService`, `WebRtcService`,
`AudioProcessorService`) and the supporting services around them.

- Related: [configuration.md](./configuration.md) · [testing.md](./testing.md) ·
  [code-review.md](./code-review.md)
- Backend counterpart: [`../../gvoice-server/CLAUDE.md`](../../gvoice-server/CLAUDE.md)

---

## 1. Rendering model

**Standalone components + signals everywhere.** There are no `NgModule`s and no
external state library. Components are `standalone: true`, use `inject()` instead
of constructor DI, and expose state as Angular **signals** (`signal`, `computed`,
`effect`). Reactive server events are RxJS `Subject`s on `SignalRService`;
components subscribe in constructors/`ngOnInit` and translate them into signals.

**SSR is configured but effectively off.** `src/server.ts` wires an Express +
`@angular/ssr` server, and `app.config.server.ts` merges server providers — but
every route is declared client-rendered:

```ts
// src/app/app.routes.server.ts
export const serverRoutes: ServerRoute[] = [
  { path: '**', renderMode: RenderMode.Client }
];
```

So the server only emits an app shell; the real app boots in the browser. Two
consequences that shape the whole codebase:

1. **Every service still instantiates during SSR/prerender.** Anything touching
   `window`, `document`, `navigator`, `localStorage` or `AudioContext` must be
   guarded with `isPlatformBrowser(inject(PLATFORM_ID))`, or it throws on the
   server. This convention is followed across the services (e.g. `ThemeService`,
   `SettingsService`, `AudioProcessorService`). Violations are tracked in
   [code-review.md](./code-review.md).
2. **The SSR bundle is dead weight in production.** It is built but never served
   (Caddy serves the `browser/` bundle statically). See
   [deployment.md](./deployment.md).

**Theme before first paint.** `ThemeService.init()` runs via `APP_INITIALIZER`
so the `data-theme` attribute is set on `<html>` before the first render, avoiding
a flash of the wrong theme:

```ts
// src/app/app.config.ts
{
  provide: APP_INITIALIZER,
  useFactory: (t: ThemeService) => () => t.init(),
  deps: [ThemeService],
  multi: true,
}
```

> Note (Angular 21): `APP_INITIALIZER` still works but is deprecated in favour of
> `provideAppInitializer(...)`. See [code-review.md](./code-review.md) `[OPT]`.

---

## 2. Routing & the in-room shell

Routes are declared in `app.config.ts`:

```ts
const routes: Routes = [
  { path: '', component: LobbyComponent },       // room list / create / admin
  { path: 'room/:roomId', component: App },       // in-room shell
  { path: '**', redirectTo: '' }
];
// provideRouter(routes, withComponentInputBinding())
```

`App` (`src/app/app.ts`) is the in-room shell. It does **not** render the room
directly — it switches its whole UI on `signalrService.connectionStatus`
(a signal of `'Disconnected' | 'Connecting' | 'Connected' | 'Error'`):

| Status | UI shown |
|---|---|
| `Disconnected` (or anything ≠ `Connected`) | `<app-join-room>` — name + password + listen-only |
| `Connecting` | spinner / "Connecting to room…" |
| `Connected` | desktop **or** mobile layout, chosen by `LayoutService.isMobile()` |
| `Error` | full-screen "Server Disconnected" overlay → **Back to Lobby** |

`App` also owns two cross-cutting concerns:

- **Chimes** — subscribes to `peerJoined$` / `peerLeft$` to play join/leave cues.
- **Push-to-talk key handling** — see §4.4.

`LayoutService.isMobile` is a signal driven by `window.innerWidth < 768` plus a
sticky rule: once in mobile layout while watching a screen share, a rotation to
landscape keeps the mobile layout (so the video doesn't reflow away). It also
re-evaluates whenever `WebRtcService.currentStreamToWatch()` changes.

---

## 3. Signaling — `SignalRService`

`core/services/signalr.service.ts` is the single source of truth for the server
connection. It wraps `@microsoft/signalr` and exposes:

- **Two signals**: `connectionStatus` and `connectionId`.
- **RxJS Subjects for every server event** — consumers subscribe rather than
  polling. `roomJoined$` and `receiveChatHistory$` are `ReplaySubject(1)` so a
  late subscriber (e.g. the chat component mounting after join) still gets the
  last value.

| Subject | Server event | Consumed by |
|---|---|---|
| `peerJoined$` | `PeerJoined` | WebRTC (create PC), Participant (add), App (chime) |
| `peerLeft$` | `PeerLeft` | WebRTC (teardown), Participant (remove), App (chime) |
| `roomJoined$` (replay) | `RoomJoined` | Participant (roster + room name), JoinRoom (persist password) |
| `receiveSignal$` | `ReceiveSignal` | WebRTC (`handleSignal`) |
| `peerStateUpdated$` | `PeerStateUpdated` | Participant (mute/deafen/screen), WebRTC (screen chime/overlay) |
| `roomFull$` / `invalidPassword$` / `roomNotFound$` | validation | JoinRoom (error banners) |
| `roomCreated$` | `RoomCreated` | Lobby (refresh list) |
| `receiveChatMessage$` / `receiveChatHistory$` (replay) | chat | Chat component |
| `reconnected$` | (client-side) | WebRTC (drop stale peers) |

### 3.1 Connection lifecycle

`startConnection(roomId)` builds the hub with `withAutomaticReconnect()`, bumps
message size limits (for base64 image chat, see [code-review.md](./code-review.md))
and wires handlers. Outbound calls (`joinRoom`, `sendSignal`, `updateState`,
`sendChatMessage`, `createRoom`) are all guarded by
`HubConnectionState.Connected`.

`rootUrl` (see [configuration.md](./configuration.md)) is the base for both REST
(`GET /rooms`, `GET /rooms/:id/participants`) and the hub (`/hub/signaling`).

### 3.2 Reconnect handling (important — supersedes the older CLAUDE.md note)

The service **does** handle automatic reconnect. On `joinRoom`, the join params
are remembered:

```ts
this.lastJoin = { roomId, roomPassword, displayName, isListenOnly };
```

On `onreconnected`, the service (1) refreshes `connectionId`, (2) emits
`reconnected$`, and (3) **replays `Join`** so the server re-registers the peer
under the new connection id:

```ts
this.hubConnection.onreconnected((connectionId) => {
  this.connectionId.set(connectionId ?? this.hubConnection?.connectionId ?? null);
  this.reconnected$.next();                 // WebRTC drops stale peer connections
  if (this.lastJoin) {
    this.hubConnection?.invoke('Join', this.lastJoin.roomId, this.lastJoin.roomPassword,
      this.lastJoin.displayName, this.lastJoin.isListenOnly)
      .catch(err => console.error('Re-join after reconnect failed:', err));
  }
});
```

`onclose` sets status to `Error` (→ the disconnect overlay + manual rejoin).
`WebRtcService` reacts to `reconnected$` by tearing down all peer connections
**without stopping the mic**; fresh peers then arrive via the `RoomJoined` /
`PeerJoined` events that follow the automatic re-`Join`.

---

## 4. WebRTC — `WebRtcService`

`core/services/webrtc.service.ts` is the core of the app. It maintains a
**full mesh**: one `RTCPeerConnection` per remote peer, keyed by connection id in
`peerConnections`. It is entirely event-driven off `SignalRService`:

```
peerJoined$   → getLocalStream() → getOrCreatePeerConnection(id, isOfferor=true)
receiveSignal$→ handleSignal(fromId, signal)
peerLeft$     → closePeerConnection(id)
reconnected$  → closeAllPeerConnections()   (mic stays alive)
```

### 4.1 Perfect Negotiation

The mesh uses the [Perfect Negotiation](https://developer.mozilla.org/docs/Web/API/WebRTC_API/Perfect_negotiation)
pattern to survive simultaneous (glare) offers without a fixed caller/callee role:

- **Politeness** is decided by lexicographic compare of connection ids — stable
  and symmetric across the two peers:
  ```ts
  private isPolite(connectionId: string): boolean {
    const localId = this.signalrService.connectionId();
    return localId ? localId < connectionId : true;
  }
  ```
- **Offer collisions** are tracked per peer via `makingOffer` / `ignoreOffer`
  maps. On an incoming offer that collides, the *impolite* peer ignores it; the
  *polite* peer rolls back and accepts.
- **`onnegotiationneeded`** creates the offer (aborting if signaling state left
  `stable` mid-way). The initial offer is **not** kicked off manually — adding
  tracks triggers `onnegotiationneeded`, which avoids double-offers.
- **ICE candidate buffering**: candidates that arrive before the remote
  description is set are queued in `iceCandidatesQueue` and flushed right after
  `setRemoteDescription`.
- **Recovery**: `onconnectionstatechange === 'failed'` triggers `pc.restartIce()`.

> `handleSignal` parses the incoming signal with `JSON.parse(signal)` **outside**
> the try/catch — a malformed signal is an unhandled rejection. See
> [code-review.md](./code-review.md) (MED, OPEN).

### 4.2 What actually gets sent — the processed stream

Peers receive the **processed** local stream, not the raw mic. The graph
(`AudioProcessorService`, §5) produces a `MediaStreamDestination` whose track is
what's added to each `RTCPeerConnection`. When the graph is rebuilt (settings
change, device change, mic re-acquire) a callback swaps the track live on every
sender:

```ts
// constructor
this.audioProcessorService.registerStreamReadyCallback((upgraded) => {
  this.localProcessedStream = upgraded;
  this.replaceTracksInAllPeerConnections(upgraded);   // sender.replaceTrack(newTrack)
});
```

**Mic robustness.** `getLocalStream()` detects a **dead** track (`readyState ===
'ended'` after OS sleep / device unplug) and re-acquires via `getUserMedia`;
`track.onended` triggers `reacquireLocalStream()`, which pushes the fresh track
into every peer — no page reload needed. `getUserMedia` uses
`autoGainControl: false` (the compressor handles levels), mono, 48 kHz.

### 4.3 Screen share

Screen tracks ride **on top of** the audio peer connection and are renegotiated:

- `startScreenShare()` → `getDisplayMedia({ video: {frameRate:30, height:720}, audio:true })`,
  then `addTrack`s the screen tracks to every existing peer (tracked in
  `screenSenders`), broadcasts `updateState('sharingScreen', true)`, plays a chime.
- `stopScreenShare()` (also bound to the browser's native "Stop sharing" via
  `track.onended`) removes the senders and broadcasts the state off.
- Remote side: `peerStateUpdated$` for `sharingScreen` plays start/stop chimes
  and auto-closes the overlay if the watched peer stops.
- `watchStream(id)` / `closeStream()` drive `currentStreamToWatch` (a signal) that
  the layout renders via `<app-screen-share-overlay>`.

### 4.4 Mute / deafen / PTT

All three are signal-driven (`isMuted`, `isDeafened`, `isPttMode`, `isPttActive`)
and broadcast to peers via `signalr.updateState(...)`:

- **Mute** toggles `audioTrack.enabled` and emits `muted`.
- **Deafen** mutes the mic *and* zeroes every remote gain node (`applyParticipantVolume`
  returns gain 0 while deafened), emits `deafened`, and remembers the pre-deafen
  mute state to restore on undeafen.
- **PTT** — when PTT mode is on, the mic is disabled and only enabled while the
  key is held. The host listeners live in `App` (`src/app/app.ts`):
  ```ts
  @HostListener('window:keydown', ['$event']) // pttKey down → setPttActive(true)
  @HostListener('window:keyup',   ['$event']) // pttKey up   → setPttActive(false)  (NEVER suppressed)
  @HostListener('window:blur')                // safety net  → setPttActive(false)
  ```
  `keyup` is intentionally **not** gated by `shouldSuppress` and a `window:blur`
  listener force-releases PTT — otherwise Alt-Tab with the key held would leave
  the mic open. See [code-review.md](./code-review.md) (HIGH, FIXED).

### 4.5 Remote playback & VAD

For each remote stream (`ontrack`), `playRemoteStream`:

1. Runs the stream through `AudioProcessorService.processRemoteStream` (HPF).
2. Builds `source → gainNode → audioContext.destination` (the gain node is the
   per-participant volume / deafen control, `setTargetAtTime` smoothed).
3. Starts a **VAD worklet** (`vad-processor`) on the processed stream; its
   `port.onmessage` drives `ParticipantService.updateSpeakingStatus`.
4. Also attaches a hidden **muted** `<audio>` element (kept for autoplay-policy
   resume and video-stream handling). Autoplay blocks are recovered on first
   user interaction (`click` / `keydown`).

Playback source, VAD source and gain nodes are stored in separate maps and torn
down carefully in `closePeerConnection` (VAD and playback share a key; keeping
them separate prevents leaking the playback node — see the comment in the code).

`window.gvWebRtcDebug` is populated with per-peer connection/ICE/signaling state
for debugging in the console.

---

## 5. Audio pipeline — `AudioProcessorService`

`core/services/audio-processor.service.ts` owns the **single shared
`AudioContext`** (lazily created, browser-only). It builds two graphs.

### 5.1 Local mic chain (sent to peers)

`processLocalStream(stream)` builds:

```
getUserMedia
     │
     ▼
 [MediaStreamSource]
     │
     ▼
 [BiquadFilter  highpass]      HPF  — cuts rumble: 80 Hz when enhancements on, 10 Hz (≈bypass) off; Q=0.7 (Butterworth)
     │
     ▼
 [DynamicsCompressor]          gentle peak limiter: -12 dB / 4:1 / 5 ms / 200 ms when on; unity (ratio 1) when off
     │
     ▼
 [AudioWorkletNode             noise-gate-processor (public/audio-worklet.js)
   'noise-gate-processor']     block-RMS envelope + per-sample smoothing; enabled iff threshold > 0
     │
     ▼
 [AnalyserNode]                placed AFTER the gate → the settings meter shows GATED output (silent when closed)
     │
     ▼
 [MediaStreamDestination] ─────► track added to every RTCPeerConnection
```

Details worth knowing:

- The **analyser sits after the gate** on purpose, so the settings-screen level
  meter reflects the gated signal (moving the threshold slider visibly changes it).
- If the worklet isn't loaded yet, the chain degrades to
  `source → HPF → compressor → analyser → destination` (no gate) and logs a warning.
  Hence `ensureWorkletLoaded()` **must be awaited after `getUserMedia`** (so the
  context is not suspended) and before building the graph — `WebRtcService.getLocalStream`
  does exactly this.
- An `effect()` on `SettingsService` (`enableAudioEnhancements`,
  `noiseGateThreshold`, plus the `workletReady` signal) re-applies HPF / compressor
  / gate params reactively. The gate `enabled` param is stepped with
  `setValueAtTime` (not `setTargetAtTime`) so the worklet's `enabled < 0.5`
  comparison doesn't glitch during the bypass↔gate transition.

### 5.2 Remote chain (per peer)

`processRemoteStream(connectionId, stream)` is minimal:

```
remote MediaStream → [MediaStreamSource] → [BiquadFilter highpass 80 Hz] → [MediaStreamDestination]
                                                                                     │
                                        (WebRtcService then wires) → [MediaStreamSource] → [GainNode] → destination + hidden <audio>
```

> Note: `processRemoteStream` emits a `MediaStreamDestination`, and
> `WebRtcService.playRemoteStream` immediately creates a **new**
> `MediaStreamSource` from it before the gain node — an extra hop that could be
> avoided by connecting nodes directly. See [code-review.md](./code-review.md) `[OPT]`.

### 5.3 The worklets (`public/`)

Served at **absolute** paths (so they load on routed pages like `/room/123`):

| File | Processor name | Role |
|---|---|---|
| `public/audio-worklet.js` | `noise-gate-processor` | Noise gate. Block-RMS envelope follower with separate attack/release; per-sample gain smoothing to avoid clicks; `enabled < 0.5` = transparent bypass. |
| `public/vad-worklet.js` | `vad-processor` | Voice activity detection. RMS > 0.02 → posts `1` (speaking); ~400 ms hangover (150 blocks) before posting `0`. Drives speaking indicators. |

Both are registered in `ensureWorkletLoaded()` via `ctx.audioWorklet.addModule('/…')`.

---

## 6. Supporting services (`core/services/`)

| Service | Responsibility |
|---|---|
| `ParticipantService` | Roster as a signal; `localParticipant`, `isAnyScreenSharing`, `isLocalSharing` computed. Applies stored per-name volume, tracks speaking/mute/deafen/screen from `peerStateUpdated$`. |
| `SettingsService` | PTT key, audio-enhancement toggle, noise-gate threshold, input/output device id+label — all signals, persisted to `localStorage` (browser-guarded). |
| `ChimesService` | Synthesized join/leave/screen-share tones via oscillators on the shared `AudioContext`. |
| `ThemeService` | 8 themes (light/dark), `data-theme` attribute, `localStorage` persistence (SSR-guarded via `PLATFORM_ID`). |
| `LayoutService` | `isMobile` signal (width + screen-share stickiness). |
| `AdminService` | Admin-password gate. Never trusts the client flag: re-verifies the remembered password against `POST /admin/verify`. Password in `sessionStorage`. |
| `DisplayNameService` | Persisted display name + random name generator. |
| `IconService` | Pre-sanitized inline SVG icons (`bypassSecurityTrustHtml`) from `shared/icons.ts`. |

### Feature components (`features/`)

- `room/` — `LobbyComponent` (list/create/admin), `JoinRoomComponent` (join form),
  `ParticipantCard` / `ParticipantList`, `ScreenShareOverlayComponent`.
- `layout/` — `DesktopLayoutComponent` vs `MobileLayoutComponent`.
- `controls/` — `VoiceControlsComponent` (mute / PTT toggle / deafen; mobile
  tap-to-talk button).
- `chat/` — `ChatComponent` (text + pasted images as base64 data-URLs, linkify,
  lightbox).
- `settings/` — `SettingsComponent` (theme / audio / devices / controls tabs;
  live gated-output meter).

---

## 7. Data-flow summary

```
                         ┌───────────────── gvoice-server ─────────────────┐
                         │   SignalR hub /hub/signaling   +   REST /rooms   │
                         └───────▲──────────────────────────────┬──────────┘
             updateState / Join / SendSignal / chat             │ PeerJoined / ReceiveSignal /
                         │                                       ▼ RoomJoined / PeerStateUpdated / chat
                  ┌──────┴───────────────── SignalRService (Subjects + signals) ──────────────────┐
                  │                    │                     │                    │                │
                  ▼                    ▼                     ▼                    ▼                ▼
           WebRtcService       ParticipantService      ChatComponent       App (status UI)   Lobby / JoinRoom
                  │  ▲                (roster signals)                        (chimes, PTT)
   addTrack/replaceTrack │ registerStreamReadyCallback
                  ▼  │
           RTCPeerConnection(s) ◀── processed local track ── AudioProcessorService (shared AudioContext)
                  │                                             ▲            │
             ontrack (remote)                        SettingsService effect  ├─ noise-gate-processor (worklet)
                  ▼                                                          └─ vad-processor (worklet) → speaking
        processRemoteStream → GainNode (volume/deafen) → destination + <audio>
```
