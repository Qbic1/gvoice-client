# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A single, closed friend group operating on one deployment (`voice-room.ru`) that
the owner runs and administers. Everyone is a returning user: they already know
the room they want, they already have a display name saved in localStorage, and
they arrive wanting to be talking, not exploring. There is no stranger, no
first-contact prospect, and no growth audience — the lobby exists as convenience
for regulars, not as discovery for outsiders.

Two roles exist:

- **Participants** — join a room, talk, listen, chat, share a screen. No account,
  no registration; identity is a display name they type once and reuse.
- **The admin** (the owner) — unlocked by a global admin password stored in
  `appsettings.json`, verified via `POST /api/admin/verify` and remembered in
  localStorage. The admin creates rooms, each with a required room password.

Access is entirely by knowing the URL, the room, and its password. The trust
model is high: participants are people the owner knows.

## Product Purpose

VoiceRoom is a self-hosted, browser-based voice room for a small group — real-time
WebRTC P2P mesh audio for up to 10 concurrent participants, with text chat, screen
share, push-to-talk, mute/deafen, and live speaking presence.

It exists because **Discord is blocked in the users' country**. That is the
originating fact, not a marketing angle: the group needed somewhere to talk, and
the mainstream option was unavailable to them. Success is that the group can open
a URL and be in voice with each other, reliably, on infrastructure the owner
controls.

## Positioning

Four things hold simultaneously, in this order of importance:

1. **It works where Discord does not.** The product's reason to exist is
   availability. It runs on the owner's own server, reachable from the users'
   country, with no dependency on a blocked platform. Nothing in future work may
   introduce a hard dependency on a service that could be blocked the same way.
2. **Self-hosted and account-free.** No registration, no third-party account, no
   vendor holding the audio. Media is peer-to-peer and never traverses the
   signaling server. The zero-account entry path is a defining property, not a
   convenience to be traded away for features.
3. **Speed to talk.** Open URL → be in voice. The PRD target is under 10 seconds
   for a returning user. The shortest path from arrival to speaking is the
   product's core interaction and must stay short.
4. **A room you walk into, not a call you schedule.** Rooms are persistent and
   ambient — presence and always-on availability are the model, not meetings with
   invites and start times.

## Operating Context

- **Entry.** User opens the deployment URL. Root (`/`) is the lobby: a list of
  active rooms with names and live participant counts. Clicking one goes to
  `/room/:roomId`. Room ids are the slug of the room name, so they are stable
  across restarts and shareable.
- **Joining.** The join form asks for a display name (pre-filled from
  localStorage; blank auto-assigns a random adjective-noun) and the room
  password. The browser then asks for microphone permission. Granted → full
  voice. Denied or failed → the user joins **listen-only**: can hear and use text
  chat, cannot transmit, and is badged as such to everyone.
- **In the room.** Desktop shows the participant list and text chat side by side
  with a controls bar; mobile uses a bottom nav (Room / Chat / Settings) and
  `dvh` units. Screen share opens a large overlay. A settings modal carries
  theme, audio (input device, live level meter, noise gate, enhancement toggles),
  and controls (PTT key rebinding).
- **Usage scene.** Long, informal, ambient sessions among people who know each
  other — hours, not scheduled meetings — most often with the tab in the
  background while the user is doing something else. Audio cues (join/leave
  chimes) and glanceable presence matter more than dense on-screen information.
- **Desktop shell.** A WPF/WebView2 wrapper (`gvoice-wpf`) embeds the *deployed*
  site. It contains no UI of its own, so every web change is what the desktop
  users see — and only after deployment.

## Capabilities and Constraints

**Confirmed capabilities:** real-time P2P mesh voice; push-to-talk (default
Spacebar, rebindable, suppressed while the chat input has focus); mute and
deafen; speaking indicators driven by a VAD worklet; listen-only mode;
participant roster with per-user volume; text chat with persisted per-room
history (XML on disk, 100-message cap); screen sharing with overlay; join/leave
and screen-share audio chimes; automatic reconnection with a status banner and a
Leave escape hatch; multi-room lobby with admin-created, password-protected
rooms; a semantic CSS-variable theme system with 8 light/dark presets.

**Hard constraints:**

- **Capacity is 10** per room, enforced server-side; the mesh topology depends on
  it. Exceeding it means an SFU, which is out of scope.
- **HTTPS/WSS is mandatory** — browsers block microphone access otherwise.
- **Server state is in-memory** except chat history. A backend restart wipes
  rooms and participants; a re-join rejected after a restart ends the session on
  the disconnect overlay.
- **Chat is not replayed** across a user's own disconnect gap.
- **Display name is locked for the session** — changing it requires rejoining.
- **P2P exposes participant IPs to each other.** Accepted, given the trust model.
- **Room names that slugify identically collide** — ids are slugs, not GUIDs.
- **SignalR event names are duplicated as string literals** across the two repos
  with nothing checking them; renaming one is always a two-repo change.

**Terminology:** *room*, *participant*, *lobby*, *listen-only*, *deafen*,
*push-to-talk (PTT)*, *admin*. Use these; they are what the code, the PRDs, and
the UI already say.

**Explicitly undecided / not established:**

- Whether the 8-theme system is a durable commitment or the current
  implementation. It works and must not be broken casually, but it was **not**
  declared permanent — a future visual direction may revisit it.
- Duplicate display names are currently allowed; the backend neither rejects nor
  renames them (open bug BUG-B03).
- Video (beyond screen share), user accounts, and an SFU remain out of scope.

## Brand Commitments

- **The product name is "VoiceRoom."** This is locked. `gvoice` is an internal
  repo and localStorage-key prefix only and must never surface in the UI.
- **UI language is English**, confirmed, and stays English. No i18n is planned;
  future copy and layout may assume English string lengths.
- Assets on hand: `icons/icon.ico`, `icons/icon.png`. The typeface currently in
  use is Inter, loaded from Google Fonts.
- No logo system, wordmark, brand guidelines, color commitments, or voice
  documentation exist. None were declared binding — future visual work is free
  here and must not claim otherwise.

## Evidence on Hand

- `features/room/prd.md` — the master PRD (v1.2, decisions locked).
- `features/room/prd-v1.5.md` — multi-room, lobby, admin, room passwords.
- `features/**/*.md` — per-feature specs: chat and chat images, mute/deafen/PTT,
  configurable PTT key, audio devices and enhancements, display name, chimes,
  listen-only, participant list, speaking indicators, per-user volume, screen
  sharing, room hover participants, disconnect banner, mobile-friendly layout.
- `tasks.md` — milestone tracker; M1–M6 complete.
- `test.md` — E2E results and the live known-issues list.
- `gvoice-server/docs/deploy/` — docker-compose, Caddyfile, coturn topology.
- Each repo's `CLAUDE.md` and `docs/` — architecture, config, testing.

**Absences future work must not fabricate:** there are no users beyond the
owner's friend group, no testimonials, no usage metrics, no press, no pricing,
no licensing terms, and no case studies. There is no marketing surface today and
none was requested. Do not invent adoption, scale, or third-party validation.

## Product Principles

1. **Availability is the feature.** This exists because the alternative is
   blocked. Never add a hard dependency on an external service that could be
   blocked, rate-limited, or geofenced out from under the users.
2. **The shortest path to talking wins.** Anything added between opening the URL
   and being in voice must justify itself against the under-10-second target. No
   accounts, no onboarding gates, no ceremony.
3. **Presence over information density.** The primary job of the room UI is to
   answer "who is here, who is talking, can they hear me" at a glance, often from
   a background tab. Glanceability beats completeness.
4. **Degrade honestly, never silently.** Mic denied, connection dropped, room
   full, room gone, re-join rejected — every failure the architecture permits has
   a visible, named state with a way out. Interactive controls that cannot act
   while the hub is down must disable themselves.
5. **Small and trusted, by design.** Ten people who know each other. Do not
   design for moderation, discovery, growth, or strangers; that is a different
   product.

## Accessibility & Inclusion

No accessibility standard was established as a product requirement, and none is
claimed here. Recorded factually so future work is not misled: the client today
carries essentially no ARIA (one attribute across the whole app), and its core
interactions — push-to-talk, mute, deafen, speaking state — are conveyed
primarily through color and animation. Keyboard operability of the PTT key is
already load-bearing. Any future accessibility commitment is an open decision,
not an existing one.
