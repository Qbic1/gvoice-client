---
name: VoiceRoom
description: A quiet console for a small voice room — thirteen semantic tokens, eight worlds, color reserved for reporting state.
colors:
  accent: "#7c3aed"
  accent-hover: "#6d28d9"
  accent-subtle: "#f3e8ff"
  on-accent: "#ffffff"
  bg-base: "#faf5ff"
  bg-surface: "#ffffff"
  bg-muted: "#f3e8ff"
  text-primary: "#3b0764"
  text-secondary: "#7c3aed"
  text-muted: "#7b61c3"
  border: "#9181a2"
  success-500: "#047857"
  error-500: "#b91c1c"
  avatar-indigo: "#6368e7"
  avatar-magenta: "#cf3c85"
  avatar-violet: "#845be7"
  avatar-amber: "#b45309"
  avatar-blue: "#3273de"
  avatar-teal: "#0f766e"
  avatar-cyan: "#0e7490"
  avatar-purple: "#7e22ce"
  scrim-modal: "rgba(0, 0, 0, 0.5)"
  scrim-volume: "rgba(0, 0, 0, 0.6)"
  scrim-disconnect: "rgba(0, 0, 0, 0.7)"
  scrim-stream: "rgba(0, 0, 0, 0.9)"
  scrim-lightbox: "rgba(0, 0, 0, 0.92)"
typography:
  hero-glyph:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  section:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  brandmark:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 700
    lineHeight: 1
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  subtitle:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  body-alt:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 600
    lineHeight: 1.45
  label-lg:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.35
  caption:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.05em"
  micro:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.05em"
  micro-sm:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.65rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.08em"
  micro-xs:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.63rem"
    fontWeight: 700
    lineHeight: 1.2
  nano:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.6rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "0.08em"
  nano-xs:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.58rem"
    fontWeight: 600
    lineHeight: 1.15
  badge:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.2
  readout:
    fontFamily: "monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
rounded:
  bubble-tail: "2px"
  track: "3px"
  tail: "4px"
  chip: "0.25rem"
  inline: "6px"
  control: "8px"
  control-alt: "0.5rem"
  squircle: "9px"
  field: "0.625rem"
  field-alt: "10px"
  modal-icon: "11px"
  card: "0.75rem"
  card-alt: "12px"
  empty-icon: "13px"
  panel: "14px"
  volume-card: "1rem"
  modal: "18px"
  sheet: "20px"
  pill: "9999px"
  circle: "50%"
spacing:
  hair: "4px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "24px"
  "3xl": "32px"
  "4xl": "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.on-accent}"
  button-secondary:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
  button-secondary-hover:
    backgroundColor: "{colors.accent-subtle}"
    textColor: "{colors.accent}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-danger-soft:
    backgroundColor: "transparent"
    textColor: "{colors.error-500}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  icon-button:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.control-alt}"
    height: "34px"
    width: "34px"
  control-button:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.control}"
    height: "48px"
    width: "48px"
  control-button-active:
    textColor: "{colors.success-500}"
  control-button-muted:
    textColor: "{colors.error-500}"
  control-button-disabled:
    backgroundColor: "{colors.bg-muted}"
    textColor: "{colors.text-muted}"
  participant-card:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.field}"
    padding: "12px"
  participant-card-speaking:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
  participant-card-local:
    backgroundColor: "{colors.accent-subtle}"
  room-card:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.card-alt}"
    padding: "14px 16px"
  join-chip:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
    typography: "{typography.caption}"
  input-field:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.field-alt}"
    padding: "12px 16px"
    typography: "{typography.title}"
  message-bubble-remote:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.card-alt}"
    padding: "12px 16px"
  message-bubble-local:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.card-alt}"
    padding: "12px 16px"
  status-pill:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.success-500}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
    typography: "{typography.caption}"
  status-pill-reconnecting:
    textColor: "{colors.error-500}"
  badge-status:
    backgroundColor: "{colors.bg-muted}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.tail}"
    padding: "2px 6px"
    typography: "{typography.badge}"
  key-badge:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.control}"
    padding: "6px 16px"
    typography: "{typography.title}"
  notice-error:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.error-500}"
    rounded: "{rounded.field-alt}"
    padding: "12px"
---

# Design System: VoiceRoom

## Overview

**Creative North Star: "The Quiet Console"**

VoiceRoom is a panel you glance at, not a page you read. Its users keep it open
for hours in a background tab while doing something else; the interface's whole
job is to answer *who is here, who is talking, can they hear me* in the width of
one look. So the system is built on restraint that isn't timidity: the layout
holds still, the type stays small and dense, and color is spent almost entirely
on reporting state rather than on decorating surfaces. When something in the
console lights up, it means something changed.

The identity does not live in a palette, because there isn't one fixed palette.
Thirteen semantic tokens — three backgrounds, three text weights, a border, a
three-step accent, the foreground that rides on it, and the two status colors —
are redefined wholesale by eight named themes (Purple, Ocean, Rose, Amber and
their dark counterparts Dark Purple, Midnight Ocean, Noir, Obsidian), and *every*
component color routes through those thirteen names. What stays constant across
all eight worlds is the structure: the spacing rhythm, the radius ladder, the
weight hierarchy, and the roles the colors play. That invariance is the design
system. Hue is the user's; grammar is ours.

The component feel is **tactile and physical**. Voice controls are 48px squares
seated in a recessed tray. The push-to-talk key renders as an actual keycap with
a thickened 3px bottom border. Every pressable surface scales down on `:active`,
and mobile controls fire a 15ms haptic tick. Interactive chrome carries 1.5px
borders where passive surfaces carry 1px, and hovers lift a single pixel — but
only on devices that actually hover.

**Key Characteristics:**
- Thirteen semantic tokens, eight themes, no raw hex in component code.
- Color reports state; it does not decorate. Green means a mic is open.
- Emphasis at small sizes comes from weight and tracking, never from size.
- Flat surfaces separated by hairline borders; shadow means "floating" or "hovered".
- Every state readable with all motion switched off.
- Presence is glanced at, not studied: the roster is a panel, not the stage.

## Colors

The palette is a set of roles, not a set of colors. Thirteen CSS custom
properties carry every surface, text, border, accent and status value in the
app; eight themes redefine all thirteen at `[data-theme]` on the document root.
Every pair is verified against WCAG AA by `scripts/check-contrast.mjs`, which
fails the build on a violation — 120 pairs across the eight themes.

### Primary

- **Accent** (`--accent`): the user's chosen operator color. It carries primary
  buttons, the local user's chat bubble, focus rings, active tabs and nav items,
  capacity-bar fill, the brand mark, and every "this is selected" border. Purple
  `#7c3aed` by default; teal, crimson, ochre and four lighter dark-theme variants
  elsewhere. Ocean and Amber are deliberately deepened (`#0f766e`, `#b45309`) so
  their foreground clears contrast.
- **Accent Hover** (`--accent-hover`): the pressed/hovered step. Light themes
  darken; dark themes *brighten* — the deliberate inversion that keeps hover
  legible against a dark ground.
- **Accent Subtle** (`--accent-subtle`): the tint used for selected and
  local-user states. It is the accent at panel weight, and it is what lets
  selection read without a border change.
- **On Accent** (`--on-accent`): the foreground that rides on an accent fill.
  White in the four light themes; a near-black derived from the accent's own hue
  in the four dark ones, where the accent glows too brightly to carry white.

### Neutral

- **Base** (`--bg-base`): the page ground; also the recessed fill for inputs
  sitting on a surface.
- **Surface** (`--bg-surface`): cards, panels, headers, modals, the roster panel.
- **Muted** (`--bg-muted`): the recessed tone — the control tray, the meter well,
  disabled fills, status-badge fills.
- **Text Primary / Secondary / Muted**: names and values; section and field
  labels; placeholders, hints and counts. All three clear 4.5:1 on both the
  surface and the base of their own theme.
- **Border** (`--border`): the hairline doing nearly all separation work, at 1px
  on passive surfaces and 1.5px on interactive chrome. Every theme's border
  clears 3:1 against its surfaces — without that, the separation strategy this
  system depends on would be invisible.

### Status

- **Success** (`--success-500`): a mic is open, a peer is present, the connection
  is live. `#047857` in light themes, `#34d399` in dark.
- **Error** (`--error-500`): muted, deafened, at capacity, disconnected,
  reconnecting, destructive. `#b91c1c` in light themes, `#f87171` in dark.

### Tertiary

- **Avatar identity palette** (eight swatches, `#6368e7` `#cf3c85` `#845be7`
  `#b45309` `#3273de` `#0f766e` `#0e7490` `#7e22ce`): the one place raw hex is
  legitimate. A display name or room name is hashed to a stable index so the same
  person is the same color for everyone, in every theme. Every swatch clears
  4.5:1 with the white initials it carries, and the set contains **no green and
  no red hue** — those carry state here, and a participant must never be tinted
  the color that means "this person is speaking".
- **Scrims** (`rgba(0,0,0,…)` at 0.5 / 0.6 / 0.7 / 0.9 / 0.92): overlay grounds,
  darkening with the weight of what they interrupt — a modal at 0.5, the
  full-screen image lightbox at 0.92.

### Named Rules

**The Thirteen Tokens Rule.** No component may contain a raw color value. Every
background, text color, and border resolves to one of the thirteen semantic
variables. The only sanctioned exceptions are the avatar identity palette, the
five scrims, and the screen-share overlay's close button — which draws on its own
near-black ground regardless of theme and so is pinned rather than themed.

**The Status Colors Adapt, Their Roles Do Not.** Success and error are redefined
per theme. This supersedes an earlier rule that fixed them to single values: a
single color cannot clear 4.5:1 against both a white and a near-black surface —
the constraints are arithmetically incompatible, requiring lightness ≤0.179 and
≥0.208 at once. What stays constant is the *meaning*: green is a live mic,
red is a constraint or a failure, in all eight worlds. Never borrow either for
anything that is not a state report.

**The Tint, Don't Pick Rule.** Status backgrounds and borders are derived, not
chosen: `color-mix(in srgb, var(--error-500) 12%, var(--bg-surface))` for fills,
`color-mix(… 30%, transparent)` for borders. Established mixes are 8–15% for
fills and 25–35% for borders. Never hand-pick a tint hex; it will only be right
on one background.

**The One Loud Color Rule.** A single screen shows at most one accent-filled
element competing for attention at rest. The room card's Join chip fills with
accent *on hover or press*, not at rest.

**The Gate Runs.** `npm run check:contrast` verifies 120 token pairs across all
eight themes plus the avatar palette. A ninth theme cannot ship with an
unreadable pair. This is not advisory — it exits non-zero.

## Typography

**All roles:** Inter (with `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`,
`Roboto`, sans-serif fallbacks), weights 500–900.
**Readout:** the platform `monospace` stack, for live numeric values only.

**Character:** One family doing every job, separated by weight and tracking
rather than by size. The type is *small* — display is 30px and body sits at 15px
— and it compensates with a wide weight range and heavy use of tracked uppercase
for structural labels. The result reads like instrument labelling: dense,
confident, quiet.

### Hierarchy

- **Display** (800, `1.875rem`, `-0.025em`): the join screen's title.
- **Headline** (800, `1.125rem`, `-0.025em`): modal titles, the room title.
- **Subtitle** (800, `1.0625rem`, `-0.03em`): the brand wordmark.
- **Title** (600, `1rem`): participant names, the keycap badge, form inputs.
- **Body** (400, `0.9375rem`, line-height 1.4–1.5): chat messages, empty-state
  copy, modal subtitles.
- **Label** (600–700, `0.8125rem`): buttons, room names, secondary controls.
- **Caption** (700, `0.75rem`, `0.05em`, uppercase): section headers, field
  labels, status pills. The workhorse and the most characteristic treatment here.
- **Micro** (600–900, `0.58–0.7rem`, `0.04–0.1em`, often uppercase): bottom-nav
  items, mode labels, capacity counts, badges. Tracking widens as size shrinks.
- **Readout** (700, `0.75rem`, monospace, accent): live numeric values only.
  Monospace signals "this number is changing" and stops digits jittering.

**A note on the recorded scale.** The frontmatter above lists **eighteen** size
steps because that is what the code actually contains. It is an inventory, not a
scale, and it should shrink. Four of them cluster inside 9.3–10.4px
(`0.58 / 0.6 / 0.63 / 0.65rem`) where one step would do; `0.875` and `0.9rem`
differ by less than half a pixel, as do `1.125` and `1.2rem`. Nothing depends on
those distinctions — they are drift, recorded honestly so the gap is visible
rather than hidden behind a scale the code never followed.

### Named Rules

**The Shout in Small Rule.** Emphasis at small sizes comes from weight, case, and
letter-spacing — never from size. A label does not get bigger to matter more; it
goes to 700, uppercase, and `0.05em`.

**The Tracking Inversion Rule.** Tracking runs opposite to size. Above `1rem`
tighten (`-0.025em` to `-0.03em`); below `0.75rem` open up (`0.05em` to `0.1em`).

**The Ellipsis Always Rule.** Every user-supplied string — display names, room
names — is `white-space: nowrap` + `overflow: hidden` + `text-overflow: ellipsis`
inside a `min-width: 0` flex child. Names are capped at 20 characters on input,
but nothing in the layout may grow to fit one.

**The Measure Rule.** Chat is the only reading surface here, and it caps at
`--chat-measure` (1040px) with bubbles at `min(72%, 620px)`. The composer reads
the same token, so the field lines up with the messages above it.

## Layout

**The two shells.** `LayoutService.isMobile` picks between a desktop shell and a
mobile shell — genuinely separate component trees. Desktop is a full-height
column: a header bar on `--bg-surface`, then a flex row of a **roster panel** and
a **chat area**. Mobile is header → single active panel → a bottom nav of three
equal-flex tabs (Room / Chat / Settings), with only one panel mounted at a time.

**The room's proportions.** The roster is a `clamp(280px, 22%, 360px)` panel and
chat is the main area. Presence is glanced at rather than studied: it needs
enough width for legible cards, not the largest share of the screen, and ten
people read top to bottom in one column. At 1920 that is roster 360px / chat
1560px; at 1440, 317px / 1123px. The panel stops growing once a card is
comfortable, so extra width goes to the conversation.

**The lobby.** A `max-width: 860px` centered column. Room cards are a single-column
flex stack below 580px and an `auto-fill, minmax(260px, 1fr)` grid above it.

**Height model.** Every full-screen container uses `100dvh`, never `100vh`. All
bottom chrome adds `env(safe-area-inset-bottom)`; the reconnect banner adds
`env(safe-area-inset-top)`.

**Breakpoints.** Content-derived rather than device-derived: **360px** (drop the
rooms-badge label), **380px** (buttons go icon-only), **580px** (room grid
engages), **600px** (lobby padding, card radius, modal centers), **640px** (join
card goes full-bleed), **768px** (chat loses its border), **800px** (participant
popover flips below), **1100px** (roster panel narrows).

**Spacing rhythm.** A 4px base in rem: `0.25 / 0.375 / 0.5 / 0.625 / 0.75 / 1 /
1.25 / 1.5 / 2 / 2.5rem`. Density is high throughout: this is a console, and
whitespace groups rather than breathes.

### Named Rules

**The Ten Slot Rule.** The roster is capped at 10 participants server-side, so
every list here is bounded and short. Do not virtualize, do not paginate, do not
design an overflow affordance — and one column is enough.

**The Two Shells Rule.** Desktop and mobile are separate components by design. A
room feature must be placed deliberately in both; a change that appears only in
`desktop-layout` is half-shipped.

## Elevation & Depth

The system is near-flat. Hairline borders do essentially all separation work.
`--shadow-sm` sits on cards, headers and control buttons as a barely-perceptible
seat. `--shadow-md` and `--shadow-lg` are reserved for things genuinely floating:
modals, the participant popover, the mobile PTT button, the join card. The only
color-bearing shadows are accent glows under the brand mark and the primary
button, plus a green glow under the transmitting PTT button. The lobby adds two
fixed blurred accent orbs (500px and 400px, `blur(80px)`, at 10% and 7% opacity).

### Shadow Vocabulary

- **`--shadow-sm`** (`0 1px 2px 0 rgb(0 0 0 / 0.05)`): seated.
- **`--shadow-md`** (`0 4px 6px -1px …, 0 2px 4px -2px …`): lifted — hover, the
  mobile PTT button, the reconnect banner.
- **`--shadow-lg`** (`0 10px 15px -3px …, 0 4px 6px -4px …`): floating — modals,
  sheets, popovers.

### Named Rules

**The Shadow Means Airborne Rule.** A shadow is not decoration and not hierarchy.
It appears when an element is literally above the page or is responding to the
pointer. A surface that is merely important gets a border and a tone.

## Shapes

Uniformly rounded, no sharp corners. Radius scales with the surface it wraps —
3px on a slider track, 8–10px on controls and fields, 12–14px on cards and
panels, 18–20px on modals and the mobile sheet, fully round for status and
identity shapes.

**Borders.** 1px on passive surfaces; **1.5px** on interactive chrome — a subtle
but consistent tell that an element can be pressed. The keycap badge alone
thickens its bottom edge to **3px**, the system's one piece of literal
skeuomorphism. Dashed 1.5px marks empty states.

**A note on the recorded ladder.** As with type, the frontmatter lists what the
code contains: nineteen values, including `9px`, `11px` and `13px` sitting beside
`8`, `10`, `12` and `14`. Those three are drift. The intended rungs are
3 / 4 / 6 / 8 / 10 / 12 / 14 / 20 / pill / circle.

### Named Rules

**The Radius Ladder Rule.** Radius is a function of the element's size and role,
not a per-component choice. A new component picks a rung; it does not invent a
value.

**The Chat Bubble Tail Rule.** Message bubbles keep 12px on three corners and
collapse to **2px** on the corner nearest their sender — bottom-left for remote,
bottom-right for local. The only asymmetric radius in the system, and what makes
authorship readable without an avatar.

## Components

### Buttons

- **Shape:** rounded rectangle, 8px.
- **Primary:** accent fill, `--on-accent` text, with an accent-tinted glow. Hover
  moves to `--accent-hover` and lifts 1px. Disabled drops to `--bg-muted`.
- **Secondary:** surface fill, 1px border. Hover swaps border to accent,
  background to `--accent-subtle` — the button warms rather than darkening.
- **Danger-soft:** transparent fill, error-tinted border, error text. Destructive
  actions never get a solid red fill.
- **Icon button:** 34px square drawn, 44px target. Hover warms the border; active
  fills with accent.
- **Press:** every button scales to `0.97` on `:active` over 60ms.

**Touch targets are areas, not pictures.** Where a 44px control would be too
heavy for its context, the button draws smaller and carries its target on a
centred `::after`. Drawn 32–34px, hit 44px.

### Voice Controls

The signature component. Three 48px squares inside a **recessed tray** —
`--bg-muted`, 4px padding, 12px radius — so they read as seated *in* the surface.

- **Active (mic open):** glyph goes success. **Muted/deafened:** glyph goes error
  and the background mixes in 12% error. **PTT on:** inverts fully to
  `--text-primary` fill with `--bg-surface` glyph.
- **Disabled (listen-only):** 50% opacity, `--bg-muted`, and a `title` and
  `aria-label` naming the reason.
- **Mobile PTT:** a 140px circle with an 8px ring, a stacked mic glyph and a
  900-weight `TAP TO TALK`. Transmitting inverts, turns the glyph green, scales
  to `0.95` and glows. Every toggle fires `navigator.vibrate(15)`.

### Participant Card

- 10px radius, 1px border, 44px hash-colored avatar with a white initial.
- **Speaking** sets a 3px success ring pulsing around the avatar **and** turns the
  card's border success with an 8% success fill — the state is legible with every
  animation off.
- **Local user** is permanently `--accent-subtle` and hover-inert.
- **Status row:** mute and deafen glyphs in error, a `Listen-only` badge, and a
  volume chip shown only when volume is not 100%.

### Room Card

- 12px radius (14px at ≥600px), `--shadow-sm`, a hash-colored squircle avatar.
- The room name is a real `<a>` stretched over the whole card via `::after`, so
  the card is one target, Enter activates it, and it announces a real name. The
  info button sits above the link as a separate control; **Join sits beneath it**
  and is part of the link's target.
- **Capacity:** a 3px bar filling with accent, switching to error at capacity.

### Inputs / Fields

- `--bg-base` fill on a `--bg-surface` parent — inputs are always *recessed*.
- 1px border, 10px radius, 16px text to prevent iOS zoom-on-focus.
- Every field carries a bound `<label for>` or an `aria-label`, plus an
  `autocomplete` hint, and a length bound.
- **Focus:** the global `:focus-visible` ring, or an accent outline replacing the
  border.

### Dialogs

Every overlay — settings, volume, screen share, and the lobby's two modals —
carries `role="dialog"`, `aria-modal="true"`, a label, and a shared focus trap
that moves focus in, cycles Tab inside, and restores focus to the trigger on
close. Escape closes all of them. The inline mobile Settings tab is a panel, not
a modal, and is exempt from both.

### Status Pill

Fully round, success-tinted fill, success border, preceded by an 8px dot. Bound
to the hub's connection state: steady at rest, and while reconnecting it swaps to
error tokens with the dot blinking at 1.2s — the same cadence as the reconnect
banner, so the two read as one event.

### Chat

Remote bubbles are surface with a 1px border; local bubbles fill with accent and
take `--on-accent`. Both carry an uppercase header pairing sender and time, and
the asymmetric tail corner. The message list is `role="log"` with
`aria-live="polite"`. An empty room shows a dashed empty state rather than a
blank rectangle.

### Keycap Badge

The PTT binding as a physical keycap: surface fill, 1.5px border with a **3px**
bottom edge, 800-weight text, `min-width: 80px`. The system's one deliberate
piece of skeuomorphism, and it earns its place.

### Theme Chip

A 4-column grid of chips, each a 28px circle split into background and accent
halves. **The halves carry no color values** — the chip stamps `data-theme` on
itself and reads `--bg-base` and `--accent` through the cascade, so a swatch
cannot disagree with the theme it previews.

### Motion

Motion is a token, not a per-component decision. `--t-interactive` (0.2s) and
`--t-interactive-fast` (0.15s) name the properties that actually change on state
— background, border, color, shadow, transform, opacity — and `--t-press`
(`transform 0.06s ease-out`) carries press feedback. `transition: all` does not
appear anywhere: it animates width, height and padding nothing intended to
animate, at the cost of a reflow per frame. All durations sit at or under 300ms
and no UI element uses `ease-in`.

### Named Rules

**The Mute Wins Rule.** When a participant is both muted and producing audio, the
mute indicator shows and the speaking ring is suppressed. State that constrains
outranks state that merely reports.

**The Disabled Says Why Rule.** Every disabled control carries a reason in both
`title` and `aria-label` — `title` alone never renders on touch.

**The Recessed Input Rule.** Inputs and trays sit one tone *below* their
container. Nothing interactive floats above its parent's tone.

**The Hover Capability Rule.** Every `:hover` rule is wrapped in
`@media (hover: hover) and (pointer: fine)`. Touch devices synthesise hover on
tap, and an ungated hover latches after a finger press. Where hover carries real
feedback, the touch path gets it through `:active`, which releases.

**The Background Tab Rule.** A single class, `.app-background`, is applied when
the tab is hidden and force-disables every animation, transition, caret,
backdrop-filter and glow. The usage scene is hours-long ambient sessions in a
background tab, and this switch is what keeps that cheap. Any motion, blur or
glow you add must survive being switched off by it, and the UI must remain fully
legible without it. Encode state in color, glyph and border first; motion is the
amplifier, never the message. (It is keyed to `document.hidden` on purpose — a
window visible on a second monitor is being watched, and killing the speaking
indicator there would be a loss of function.)

**The Reduced Motion Rule.** `prefers-reduced-motion: reduce` collapses durations
and stops every looping animation, and drops movement outright on the speaking
ring and status dots. Reduced motion means less movement, not a dead interface:
color and opacity transitions still carry meaning.


## Do's and Don'ts

### Do:

- **Do** route every color through the thirteen semantic tokens, and run
  `npm run check:contrast` before shipping a theme change.
- **Do** use `color-mix` for status tints, at 8–15% for fills and 25–35% for
  borders.
- **Do** reach for weight, uppercase and `0.05em` tracking when something small
  needs emphasis, and leave the size alone.
- **Do** give every user-supplied string `min-width: 0` + nowrap + ellipsis, and
  every input a length bound.
- **Do** pair every disabled state with a reason in both `title` and `aria-label`.
- **Do** give every overlay `role="dialog"`, a label, a focus trap and Escape.
- **Do** draw controls at a comfortable size and carry the 44px target on a
  pseudo-element when the drawn size would be too heavy.
- **Do** wrap every hover rule in `@media (hover: hover) and (pointer: fine)`.
- **Do** use `100dvh` and `env(safe-area-inset-*)`.
- **Do** put new room features in **both** shells.

### Don't:

- **Don't** write a raw hex value in a component. The avatar palette, the five
  scrims and the pinned overlay close button are the only exceptions.
- **Don't** borrow a status color for anything that is not a state report, and
  don't put a green or red hue in the avatar palette.
- **Don't** place more than one accent-filled element on a screen at rest.
- **Don't** add a shadow to convey importance.
- **Don't** invent a radius or a type size — and prefer the intended rungs over
  the drifted values this file records.
- **Don't** use `transition: all`.
- **Don't** rely on animation to communicate a state.
- **Don't** design an overflow affordance for the participant list.
- **Don't** use `100vh`.
