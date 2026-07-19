# Code review

Structured findings for the GVoice client. Each item lists **severity**, the
**file**, a **status** (`FIXED` = already addressed in the current code,
`OPEN` = still to do), the issue, and a recommendation.

Severity legend: **HIGH** = correctness/security/UX breakage · **MED** = latent
bug, dead code, or design smell · **LOW** = minor/robustness · **OPT** =
optimization / cleanup, no user-visible bug.

Cross-refs: [architecture.md](./architecture.md) · [testing.md](./testing.md)

| # | Sev | Status | File | Issue |
|---|---|---|---|---|
| 1 | HIGH | FIXED | `app.ts` | PTT stuck-mic on focus loss |
| 2 | HIGH | FIXED | `theme.service.ts` | `localStorage` without SSR guard |
| 3 | HIGH | FIXED | `participant.service.spec.ts` | Broken spec (stale ctor/payload) |
| 4 | MED | OPEN | `linkify.pipe.ts` | `bypassSecurityTrustHtml` on whole message |
| 5 | MED | FIXED (removed) | `audio-analysis.service.ts` | Dead code |
| 6 | MED | FIXED (removed) | `signalr.service.ts` / server | `UpdateAudioSettings` dead feature |
| 7 | MED | OPEN | `chat.component.ts` | base64 images over SignalR |
| 8 | MED | OPEN | `chat.component.ts` | `scrollToBottom` in `ngAfterViewChecked` |
| 9 | MED | OPEN | `admin.service.ts` / `join-room.component.ts` | Plaintext passwords in web storage |
| 10 | MED | OPEN | `webrtc.service.ts` | `JSON.parse` outside try in `handleSignal` |
| 11 | LOW | OPEN | `participant-list` / `chat` | No `trackBy`/`track` in `*ngFor` |
| 12 | LOW | OPEN | `participant.service.ts` | Volume keyed by display name |
| 13 | LOW | OPEN | `join-room.component.ts` | Unguarded `window`/`localStorage` (SSR) |
| 14 | LOW | OPEN | `settings.component.ts` | `setTimeout` not cleared before overwrite |
| 15 | OPT | OPEN | `audio-processor` / `webrtc` | Redundant remote source hop |
| 16 | OPT | OPEN | routing / build | SSR unused in prod |
| 17 | OPT | OPEN | `service-worker.js` | Offline navigate fallback returns `undefined` |
| 18 | OPT | OPEN | `app.ts`, `app.config.ts` | Modernize to `@if`/`@for`, `provideAppInitializer` |

---

## HIGH

### 1. PTT stuck-mic on window focus loss — `src/app/app.ts` — FIXED

**Was:** the `keyup` handler was gated by `shouldSuppress(...)`, and there was no
blur handling. If the user pressed the PTT key and then focus left the window
(Alt-Tab, clicking another app — common inside the WebView2 shell) or moved to an
input, the `keyup` was suppressed or delivered elsewhere. The mic stayed **open**
and kept transmitting.

**Fix:** `keyup` is no longer suppressed — it always releases PTT on the PTT key —
and a `@HostListener('window:blur')` force-releases:

```ts
@HostListener('window:keyup', ['$event'])
onKeyUp(event: KeyboardEvent) {
  if (event.code === this.settingsService.pttKey()) {
    if (this.webrtcService.isPttMode()) event.preventDefault();
    this.webrtcService.setPttActive(false);   // ALWAYS release
  }
}

@HostListener('window:blur')
onWindowBlur() { this.webrtcService.setPttActive(false); }
```

**Recommendation:** add the e2e regression test described in
[testing.md](./testing.md) (hold PTT → blur → mic releases) so this can't regress.

### 2. `ThemeService` read `localStorage` without an SSR guard — `src/app/core/services/theme.service.ts` — FIXED

**Was:** `init()`/`setTheme()` accessed `localStorage` directly. Because services
instantiate during SSR/prerender, this risked a `ReferenceError` on the server.

**Fix:** guarded via `PLATFORM_ID` / `isPlatformBrowser`; on the server it falls
back to the default theme and never touches storage. `setAttribute('data-theme', …)`
is safe (SSR provides `DOCUMENT`). Covered by the new SSR case in
`theme.service.spec.ts`.

### 3. `participant.service.spec.ts` was broken — FIXED

**Was:** the spec constructed the service against an **outdated constructor** and
pushed an **incorrect `roomJoined` payload** shape — it didn't reflect the real
service and gave false confidence.

**Fix:** rewritten onto `TestBed` with a `MockSignalRService` whose subjects/signals
match `signalr.service.ts` exactly, plus cases for roster population, add/remove,
case-insensitive state updates, local-participant resolution, speaking-identity
preservation and volume persistence. See [testing.md](./testing.md).

---

## MEDIUM

### 4. `LinkifyPipe` trusts the whole message as HTML — `src/app/shared/pipes/linkify.pipe.ts` — OPEN (re-evaluated: not currently exploitable)

The pipe calls `sanitizer.bypassSecurityTrustHtml(linkedText)` on the **entire**
message, so it performs **no** sanitization itself.

**Why it is not exploitable today:** the server HTML-encodes every chat message
(`SignalingHub.Sanitize`) before broadcast, there is **no local echo** (the client
renders only what the server sends back), and the URL regex only matches
`http(s)://` / `www.` — it cannot synthesize a `javascript:` href.

**Do NOT "fix" by escaping inside the pipe.** The server already encodes, so
escaping again would **double-encode** and show users literal `&lt;b&gt;`.

**Recommendation:** make sanitization a **single** responsibility with a test
contract. Preferred direction: server stores/serves **raw** text and the client
escapes **and** linkifies (with tests), rather than the current "protection lives
entirely on the server, client blindly trusts it." The regression test
`linkify.pipe.spec.ts` pins the current contract so any refactor is deliberate.

### 5. `AudioAnalysisService` is dead code — `src/app/core/services/audio-analysis.service.ts` — FIXED (removed)

The service was never injected anywhere. Speaking indicators are driven by the
`vad-processor` worklet inside `WebRtcService` (`startVADWorklet`); the
`requestAnimationFrame` RMS loop here just duplicated that with more overhead.

**Resolution:** the file was deleted.

### 6. `UpdateAudioSettings` is a dead feature — `signalr.service.ts` (client) ↔ server — FIXED (removed)

`SettingsComponent.syncSettings()` called `signalr.updateAudioSettings({ enableAudioEnhancements,
noiseGateThreshold })`, but:

- The field names were out of sync between client and server payloads.
- There was **no `AudioSettingsUpdated` subscriber** on the client — nothing
  consumed a broadcast, so the round-trip did nothing.

**Resolution:** the dead round-trip was removed — `SignalRService.updateAudioSettings`,
`SettingsComponent.syncSettings()` and its call sites, plus the server-side
`UpdateAudioSettings` hub method, event constants, `SetAudioSettings`, and the
`Participant.AudioSettings` / `AudioSettings` model. **Local** audio processing
(`SettingsService` → `AudioProcessorService`, the enhancement toggle and noise-gate
slider) is unchanged and fully functional.

### 7. Chat images sent as base64 data-URLs over SignalR — `src/app/features/chat/chat.component.ts` — OPEN

Pasted images are read with `FileReader.readAsDataURL` and sent as the message
body (`data:image/…`). A 5 MB file becomes ~6.7 MB of base64 pushed through the
hub (the client raised SignalR limits to 10 MB, and the server was bumped to match).

**Recommendation:** add a dedicated upload endpoint (store the blob, send a URL);
keep the SignalR path for text. Confirm/agree the SignalR `MaximumReceiveMessageSize`
on both ends and cap client-side before encoding. It works today but is fragile
and wastes bandwidth for a ≤10-user room.

### 8. `scrollToBottom()` runs every change-detection pass — `src/app/features/chat/chat.component.ts` — OPEN

`ngAfterViewChecked() { this.scrollToBottom(); }` forces
`scrollTop = scrollHeight` on **every** CD cycle. That is a forced reflow each pass
and it hijacks the user's scroll position (they can't scroll up to read history —
it snaps back down).

**Recommendation:** scroll only when a **new message** arrives, and only if the
user is already near the bottom (track "at bottom" on the scroll container). Drive
it from the message subscription, not `ngAfterViewChecked`.

### 9. Passwords stored in plaintext in web storage — `admin.service.ts`, `join-room.component.ts` — OPEN

- Admin password: `sessionStorage['gv_admin_pwd']` (plaintext; re-verified against
  the server on load, which is good, but still stored in clear).
- Room passwords: `localStorage['gvoice_pwd_<roomId>']` (plaintext, persistent).

Given the intentionally-minimal shared-password auth model, this is low blast
radius, but plaintext persistence is still a smell (shared machines, XSS).

**Recommendation:** at minimum prefer `sessionStorage` for room passwords too
(don't persist across sessions), and document the trust model. A real fix needs a
token/identity system server-side, which is out of scope for this app's threat
model.

### 10. `handleSignal` parses JSON outside the try/catch — `src/app/core/services/webrtc.service.ts` — OPEN

```ts
private async handleSignal(connectionId: string, signal: string) {
  const data = JSON.parse(signal);           // ← throws land as an unhandled rejection
  const pc = await this.getOrCreatePeerConnection(connectionId, false);
  try { /* … uses data … */ } catch (err) { /* only this is guarded */ }
}
```

A malformed signal string throws before the try block → unhandled promise
rejection (the subscription is `async (data) => this.handleSignal(...)`).

**Recommendation:** move `JSON.parse` inside the try (or wrap the whole body), log
and drop malformed signals.

---

## LOW

### 11. Missing `trackBy` / `track` in `*ngFor` — `participant-list.component.ts`, `chat.component.ts` — OPEN

Roster and message lists render with `*ngFor` and no identity function, so Angular
re-creates DOM nodes on each list change. With signal-driven updates
(`participants.update(...)` produces new object refs) this causes avoidable
teardown/rebuild (and can flicker speaking indicators / re-trigger media elements).

**Recommendation:** add `trackBy` (or migrate to `@for (… ; track p.connectionId)` /
`track msg.timestamp`).

### 12. Per-participant volume keyed by display name — `src/app/core/services/participant.service.ts` — OPEN

`localStorage['gv_vol_<displayName>']` — two participants with the same display
name collide, and a rename loses the setting. Connection ids are transient so
they can't key it either.

**Recommendation:** accept the limitation and document it, or key by a
server-assigned stable user id if/when one exists.

### 13. Unguarded `window` / `localStorage` in join-room — `src/app/features/room/join-room.component.ts` — OPEN

`extractRoomId()` reads `window.location.pathname` and `localStorage` directly, and
the `roomJoined$` subscription writes `localStorage` — all without an `isBrowser`
guard, violating the project's SSR convention. It happens to be fine because the
component only mounts client-side, but it's an inconsistency waiting to bite.

**Recommendation:** prefer the `ActivatedRoute` param (already used as the primary
path) and guard the `window`/`localStorage` fallbacks with `isPlatformBrowser`.

### 14. `setTimeout` overwritten without clearing — `src/app/features/settings/settings.component.ts` — OPEN

`switchToAudio()` and `ngAfterViewInit()` both assign `this.levelMeterTimeout =
setTimeout(...)` without clearing a prior pending timer, so a queued
`startLevelMeter` can leak / double-fire before `ngOnDestroy` clears the last one.

**Recommendation:** `clearTimeout(this.levelMeterTimeout)` before each reassignment.

---

## OPT (cleanup / optimization)

### 15. Redundant hop in remote audio graph — `audio-processor.service.ts` + `webrtc.service.ts` — OPEN

`processRemoteStream` builds `source → HPF → MediaStreamDestination`, then
`WebRtcService.playRemoteStream` immediately does
`createMediaStreamSource(destination.stream)` again before the gain node. That's an
extra `MediaStreamDestination` + `MediaStreamSource` round-trip per peer.

**Recommendation:** return the HPF node (or the last `AudioNode`) and connect the
gain node directly, skipping the destination/source hop.

### 16. SSR built but unused in production — routing/build — OPEN

Every route is `RenderMode.Client`; the SSR `server.mjs` is never served. See
[deployment.md](./deployment.md).

**Recommendation:** switch to a pure static build (drop `ssr` from `angular.json`,
`server.ts`, `main.server.ts`, `app.config.server.ts`, `app.routes.server.ts` and
the `@angular/ssr`/`platform-server`/`express` deps). Faster builds, one less
moving part, identical UX. Keep the `isBrowser` guards regardless — they're cheap
insurance.

### 17. Offline navigate fallback resolves to `undefined` — `src/service-worker.js` — OPEN

The `navigate` handler falls back to `caches.match('/index.html')` when offline,
but `/index.html` is not in the `install` precache (`STATIC_ASSETS`), so offline
navigation gets `undefined` and shows nothing.

**Recommendation:** precache `index.html` on install, or remove the fallback if
offline support isn't a goal. Bump `CACHE_NAME` when changing.

### 18. Modernize to Angular 21 idioms — `app.ts`, `app.config.ts` — OPEN

`App` uses `CommonModule` + `*ngIf` in its template, and `app.config.ts` uses the
deprecated `APP_INITIALIZER`.

**Recommendation:** migrate templates to built-in control flow (`@if` / `@for` — the
settings component already uses `@for`), drop `CommonModule` where no longer needed,
and replace `APP_INITIALIZER` with `provideAppInitializer(() => inject(ThemeService).init())`.
Purely stylistic, but keeps the codebase consistent with its own conventions.
