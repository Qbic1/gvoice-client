---
target: gvoice-client/src/app
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
timestamp: 2026-08-27T17-41-54Z
slug: gvoice-client-src-app
---
Method: dual-agent (A: design review, B: detector + browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | `Connected` pill is a hardcoded literal in both shells, never bound to `connectionStatus`; lies during Reconnecting. Lobby counts never refresh. |
| 2 | Match System / Real World | 2 | Join screen shows the raw slug `general`, not "General". Keycap prints raw `KeyboardEvent.code` ("KeyV"). "Room Users" drifts from the locked term *participant*. |
| 3 | User Control and Freedom | 2 | Escape closes no modal. Reset wipes all settings in one click, no confirm, no undo. |
| 4 | Consistency and Standards | 2 | DESIGN.md promises two scrims; code has five. Mobile breakpoint 768 vs 1024. Two divergent avatar palettes. |
| 5 | Error Prevention | 1 | A full room stays clickable — rejection only after filling the form. Mic denial is a silent downgrade. |
| 6 | Recognition Rather Than Recall | 1 | PTT key shown nowhere in-room, absent entirely on mobile. Zero unread indicator anywhere. |
| 7 | Flexibility and Efficiency | 3 | Name + password persist and prefill. But the documented random-name fallback is unreachable. |
| 8 | Aesthetic and Minimalist Design | 3 | Type system disciplined and characteristic. Theme tab triples every signifier and owns the mobile settings surface. |
| 9 | Error Recovery | 1 | No error is announced to AT. Listen-only gives no diagnosis and no recovery path. |
| 10 | Help and Documentation | 2 | Audio-tab hints are strong. "Listen-only" and "Deafen" unexplained at the moment of choice. |
| **Total** | | **18/40** | **Poor (45%)** |

## Design Specificity Verdict

~30% authored / ~70% category-interchangeable. The in-room console (recessed 48px control tray, PTT keycap, 140px mobile walkie-talkie, VAD hangover, blur force-release) is specific to this product. The lobby, settings shell, and room composition are stock SaaS dashboard — and that is what the user sees first and longest. Nothing on the lobby is about sound.

Deterministic scan: 65 findings. CLI on `src/app` — 39 `design-system-font-size` (12 distinct off-ramp values vs 6 documented), 12 `design-system-color`, 8 `design-system-radius`, 2 `broken-image`, 1 `layout-transition`. CLI on `styles.css` — 2 `overused-font`, 1 `design-system-color`. Browser overlay injected successfully on 3 views: lobby 16 anti-patterns, join form 1, in-room 9 (undersized-ui-text, low-contrast, flat-type-hierarchy, pulsing-dot, skipped-heading).

## Priority Issues

### [P0] Status indicator reports a state it never reads

`Connected` is a literal string at desktop-layout.component.ts:60 and mobile-layout.component.ts:52, never bound to `signalrService.connectionStatus`; its dot blinks unconditionally. The room deliberately stays mounted through a reconnect — exactly when a persistent indicator earns its keep, and exactly when it lies. Borrows Voice Green for a false report.

Fix: bind the pill to status; on Reconnecting swap to error tokens and sync the blink with the banner; remove the always-on animation.
Command: /impeccable harden

### [P0] White-on-accent fails contrast in 7 of 8 themes; --text-muted fails in 7 of 8

Measured live across all themes. Obsidian white-on-accent = 1.78:1 — a user cannot read their own chat bubble. `--text-muted` is 1.48 in ocean, 1.67 in amber. `--border` never exceeds 1.41:1 against its surface, so the entire documented separation strategy is below the 3:1 non-text threshold.

Fix: add an `--on-accent` token per theme instead of hardcoded `#fff`; darken every `--text-muted` to >=4.5:1; lift every `--border` to >=3:1; add a build-time assertion over the theme table.
Command: /impeccable colorize

### [P1] Mic denial is a silent downgrade and the mode label contradicts it

join-room.component.ts:314 flips to listen-only with no message, banner, or recovery path. voice-controls.component.ts:63 renders "OPEN MIC" for a listen-only user — verified live. Explanations live in `title`, which never renders on touch.

Fix: listen-only branch on the mode label; persistent in-room strip naming the state with a rejoin action; correct the disabled PTT title.
Command: /impeccable harden

### [P1] Presence gets 1.4% of the room; chat gets 78%

Measured at 1440x900: sidebar 320x835, content 1120x835, participant list 287x109. Empty chat renders a completely blank 1120x835 region — no empty-state branch exists.

Fix: invert the ratio at >=1024px, roster as the content grid with 64px avatars, chat as a 360px rail; 3px speaking ring plus a static speaking signifier that survives `.app-background`; real chat empty state.
Command: /impeccable layout

### [P1] Focus, modals, keyboard

Zero `:focus-visible` in the codebase. Sliders carry `outline: none` with no replacement. Overlays have no dialog role, no focus trap, no Escape. Visible rings are Chrome UA defaults; the `.info-btn` ring computes to `--text-muted` = 2.72:1, below the 3:1 non-text threshold.

Fix: global `:focus-visible`; delete bare `outline: none`; role/aria-modal/autofocus/restore/Escape per overlay; tablist semantics on settings tabs.
Command: /impeccable audit

### [P2] Motion craft

Durations (all <=300ms) and easing (no `ease-in`) are strong. But `transition: all` x28; zero `@media (hover: hover)` so every hover sticks after a tap; `prefers-reduced-motion` once, guarding one dot while 12 infinite animations run unguarded; popover scales from center while side-anchored; zero `:active` press feedback against a documented "tactile and physical" character; `.app-background` neutralizes backdrop-filter on one selector while four other blurs survive, and it is driven by `document.hidden` so a visible-but-unfocused window is never covered.

Command: /impeccable animate

## Persona Red Flags

**Sam (keyboard + screen reader):** room card focuses but Enter does nothing (div with tabindex, no role, no href) — verified live. Three `.info-btn` have no accessible name. PTT rebind is a div with (click), unreachable by keyboard. With PTT on, `preventDefault` on Space blocks activation of every button. Message list has no aria-live.

**Casey (distracted mobile, one hand):** only header action is 36x36 in the top-right corner. `.info-btn` is 28x28 inside a tappable card. Incoming messages produce nothing — no badge, and the chat panel is not even mounted. `title`-only explanations never render on touch. The signature TAP TO TALK button hides behind an unexpanded acronym.

**Jordan (first-timer):** asked for a password nobody mentioned. Bare "Join as Listen-only" checkbox. Blank name keeps the button disabled — documented fallback unreachable. "PTT" and "Deafen" are Discord vocabulary; hover answers "Enable PTT".

## Minor Observations

Lobby has no h1; disconnect card heading is an orphan h3. `.section-hint` says "Tap to join" on desktop. `#10b981` (Voice Green) is in both avatar hash palettes — a participant can be colored the exact color that means "mic open". `.speaking-ring` sets both border and outline in the same color (doubled 4px ring). Device labels fall back to a raw deviceId fragment. Noise-gate range input has no label and no aria-valuetext. Every close control is a bare x with no accessible name. `<video muted>` in the screen-share overlay means shared tab audio never plays. Viewport meta sets `maximum-scale=1, user-scalable=0` — WCAG 1.4.4 failure. Zero horizontal overflow and zero 4xx/5xx on every view tested.

## False Positives

`broken-image` on Angular `[src]` bindings (user-pasted images, alt present). `overused-font` on Inter (documented deliberate choice). Service Worker console error (environment artifact; the file serves 200). `NotAllowedError` (no mic in the automation environment). Disabled-button contrast (exempt under WCAG 1.4.3).

## Questions to Consider

1. The lobby is a project dashboard for a product about sound. What if a room card showed who is speaking right now instead of a static capacity bar? That data already streams.
2. Why is there a join form at all for a returning user, when both fields are already filled and the stated core interaction is "open URL, be in voice, under 10 seconds"?
3. Chat gets 78% and presence 1.4%, in a product whose third principle is "presence over information density". Decision, or accident of chat needing a big rectangle?
4. `.app-background` admits most of this interface's life is spent with animation off. Why is the primary speaking indicator an animation? What is the design when nothing moves — and shouldn't that be authored first?
5. Eight themes, seven failing contrast on their own primary button. PRODUCT.md records the theme system was never declared permanent. Are 8 hues serving users, or are they 8x the verification surface?
6. The most product-specific object built — the 140px walkie-talkie with haptics — hides behind an unexpanded acronym, on mobile only. What if PTT were the mobile default and that button were the Room tab?
