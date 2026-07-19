# Testing

Two layers: **Vitest** unit tests (fast, headless, jsdom) and **Playwright** e2e
tests (real backend + dev server + fake media). This page lists what exists today
and what is worth adding.

- How to run everything: [development.md](./development.md) §7–§8.
- **All runners require Node ≥ 22.12** (Vitest/jsdom won't start below it).

---

## 1. Unit tests (Vitest)

Runner: `@angular/build:unit-test` → Vitest 4, jsdom. Run with `ng test` or
`npx vitest run <file>`.

| Spec | Covers |
|---|---|
| `src/app/core/services/participant.service.spec.ts` | **Rewritten** onto `TestBed` with a `MockSignalRService` whose subject/signal shapes match the real service. Cases: empty start; `roomJoined` populates roster + room name + default/stored volume; `peerJoined` add; `peerLeft` remove; case-insensitive `peerStateUpdated` (muted/deafened/sharingScreen); `localParticipant` by connection id; `isAnyScreenSharing`; `updateSpeakingStatus` identity-preservation; `updateParticipantVolume` persists to `localStorage`. |
| `src/app/core/services/settings.service.spec.ts` | PTT-key default, load-from-`localStorage`, save, reset-to-default (with a stubbed `localStorage` and `PLATFORM_ID: 'browser'`). |
| `src/app/core/services/theme.service.spec.ts` | **New.** Default → `purple`; restore a valid stored theme; ignore an invalid one; `setTheme` updates signal + `data-theme` attribute + `localStorage`. Plus an **SSR case** (`PLATFORM_ID: 'server'`) proving it never touches `localStorage` and doesn't throw — the regression guard for the SSR fix. |
| `src/app/shared/pipes/linkify.pipe.spec.ts` | **New.** Pins the pipe's **security contract**: http(s)/www URLs → anchors with `rel="noopener noreferrer" target="_blank"`; no `javascript:` hrefs; **server-encoded text passes through without re-encoding** (no double-encoding). Documents that sanitization is the server's responsibility. |
| `src/app/app.spec.ts` | Smoke: `App` creates; default `connectionStatus` is `Disconnected`. |

### Why the participant + linkify specs matter

- The old `participant.service.spec.ts` was **broken** — it drove an outdated
  constructor and an incorrect `roomJoined` payload shape. The rewrite pins the
  real event shapes so this kind of drift is caught (see
  [code-review.md](./code-review.md) HIGH, FIXED).
- `linkify.pipe.spec.ts` exists specifically to **lock the contract** around
  `bypassSecurityTrustHtml`: the pipe does not sanitize, the server does. The test
  asserts that "fixing" the pipe by escaping (which would double-encode) is wrong.

---

## 2. E2E tests (Playwright)

Location: `tests/task*.spec.ts`. **Integration** tests — they need the dev server
(`:4200`) **and** the backend (`:5293`) running, seeded room `general`, password
`123`. Single worker on purpose (in-memory server room state races otherwise).

| Spec | Scenario |
|---|---|
| `tests/task1-mesh.spec.ts` | Two users join `general` and see each other (mesh + participant cards). |
| `tests/task2-capacity.spec.ts` | 10 users allowed, **11th blocked** (server-side `RoomFull`). ~2 min. |
| `tests/task3-stability.spec.ts` | Room id is a **stable slug** of the room name (secret-URL stability). |
| `tests/task4-reconnect.spec.ts` | Offline via CDP `Network.emulateNetworkConditions`, then back online — reconnect/stay-in-room. |
| `tests/task4.1-restart.spec.ts` | Backend killed (`taskkill /IM GVoice.API.exe`) → **disconnect overlay** shows → manual rejoin. Windows-specific kill command. |
| `tests/task5-ptt.spec.ts` | PTT toggle mutes; **Space down** unmutes (LIVE), **Space up** re-mutes; verified via the peer's participant-card `.indicator.muted`. |
| `tests/task7-audio-reliability.spec.ts` | User B rejoins 3× while A stays; mesh recovers each time; asserts a remote `<audio>` element exists per peer. |

Chromium runs with `--use-fake-ui-for-media-stream` / `--use-fake-device-for-media-stream`
/ `--mute-audio`, so `getUserMedia` returns a synthetic mic with no prompt.

---

## 3. Gaps worth closing

The e2e suite is strong on **mesh lifecycle / reconnection / PTT** but leaves
whole features untested. High-value additions:

| Priority | Test | Why |
|---|---|---|
| **High** | **Chat send/receive** (text) | Core feature, zero coverage. Assert message appears on both peers; assert history replay (`receiveChatHistory$`) on late join. |
| **High** | **Screen share** start/stop | `startScreenShare` / overlay / auto-close on remote stop are untested. Use `--auto-select-desktop-capture-source` or a fake source. |
| **High** | **PTT-blur regression** | Lock the HIGH/FIXED fix: hold PTT key, blur the window (Alt-Tab), assert the mic **releases** (`.indicator.muted` returns). Prevents the "stuck mic" regression. |
| Medium | **Per-participant volume + deafen** | Volume slider persists (`gv_vol_*`); deafen zeroes remote gain and mutes self; undeafen restores prior mute state. |
| Medium | **Listen-only join** | Join with the listen-only checkbox → no mic sent, controls reflect it (`isListenOnly`). |
| Medium | **Create room** (admin) | Admin login → create → room appears via `RoomCreated`. |
| Low | **Noise gate / enhancements toggle** | Settings meter reacts; params applied. Hard to assert audibly, but the `AudioParam` values / gated-meter behaviour can be checked. |

### Unit-test gaps

- `WebRtcService` Perfect-Negotiation logic (`isPolite`, offer-collision handling,
  ICE queueing) — currently only exercised indirectly via e2e. Worth unit-testing
  with a mocked `RTCPeerConnection`.
- `AudioProcessorService` graph wiring (which nodes connect in which order,
  worklet-not-ready fallback) — pure enough to unit-test with a Web Audio mock.
- `SignalRService.onreconnected` replay-`Join` behaviour.

> When adding specs, keep mock shapes in sync with the real services — that is
> exactly the drift the participant-service rewrite was fixing.
