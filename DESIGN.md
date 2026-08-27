---
name: VoiceRoom
description: A quiet console for a small voice room — eleven semantic tokens, eight worlds, color reserved for reporting state.
colors:
  accent: "#7c3aed"
  accent-hover: "#6d28d9"
  accent-subtle: "#f3e8ff"
  bg-base: "#faf5ff"
  bg-surface: "#ffffff"
  bg-muted: "#f3e8ff"
  text-primary: "#3b0764"
  text-secondary: "#7c3aed"
  text-muted: "#a78bfa"
  border: "#e9d5ff"
  voice-green: "#10b981"
  failure-red: "#ef4444"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.05em"
  readout:
    fontFamily: "monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  chip: "4px"
  inline: "6px"
  control: "8px"
  field: "10px"
  card: "12px"
  panel: "14px"
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
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "8px 14px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "#ffffff"
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
    textColor: "{colors.failure-red}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  control-button:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.control}"
    height: "48px"
    width: "48px"
  control-button-active:
    textColor: "{colors.voice-green}"
  control-button-muted:
    textColor: "{colors.failure-red}"
  control-button-disabled:
    backgroundColor: "{colors.bg-muted}"
    textColor: "{colors.text-muted}"
  participant-card:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.field}"
    padding: "12px"
  participant-card-hover:
    backgroundColor: "{colors.accent-subtle}"
  participant-card-local:
    backgroundColor: "{colors.accent-subtle}"
  room-card:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.card}"
    padding: "14px 16px"
  input-field:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.field}"
    padding: "12px 16px"
    typography: "{typography.title}"
  message-bubble-remote:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.card}"
    padding: "12px 16px"
  message-bubble-local:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.card}"
    padding: "12px 16px"
  badge-status:
    backgroundColor: "{colors.bg-muted}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.chip}"
    padding: "2px 6px"
  key-badge:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.control}"
    padding: "6px 16px"
    typography: "{typography.title}"
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
Eleven semantic tokens — three backgrounds, three text weights, a border, and a
three-step accent — are redefined wholesale by eight named themes (Purple, Ocean,
Rose, Amber and their dark counterparts Dark Purple, Midnight Ocean, Noir,
Obsidian), and *every* component color routes through those eleven names. What
stays constant across all eight worlds is the structure: the spacing rhythm, the
radius ladder, the weight hierarchy, and the two status colors that refuse to
theme. That invariance is the design system. Hue is the user's; grammar is ours.

The component feel is **tactile and physical**. Voice controls are 48px squares
seated in a recessed tray. The push-to-talk key renders as an actual keycap with
a thickened 3px bottom border. Mobile controls fire a 15ms haptic tick. Interactive
chrome carries 1.5px borders where passive surfaces carry 1px, and hovers lift a
single pixel. Nothing announces itself, but everything answers when touched —
and future work should push that physicality further rather than sand it flat.

**Key Characteristics:**
- Eleven semantic tokens, eight themes, zero raw hex in component code.
- Color reports state; it does not decorate. Green means a mic is open.
- Emphasis at small sizes comes from weight and tracking, never from size.
- Flat surfaces separated by hairline borders; shadow means "floating" or "hovered".
- Radius scales with the surface it wraps: 4px on chips, 20px on the mobile sheet.
- Every animation, blur, and glow must survive being switched off in one class.

## Colors

The palette is a set of roles, not a set of colors. Eleven CSS custom properties
carry every surface, text, border, and accent value in the app; eight themes
redefine all eleven at `[data-theme]` on the document root. Only three colors are
fixed across all eight worlds.

### Primary

- **Accent Violet** (`--accent`, default theme): the user's chosen operator
  color. It carries primary buttons, the local user's chat bubble, focus rings,
  active tabs and nav items, capacity-bar fill, the brand mark, and every "this
  is selected" border. Each theme substitutes its own: teal in Ocean, crimson in
  Rose, ochre in Amber, and lighter, glowing variants in the four dark themes.
- **Accent Hover** (`--accent-hover`): the pressed/hovered step. In light themes
  it darkens; in dark themes it *brightens* — the deliberate inversion that keeps
  hover legible against a dark ground.
- **Accent Subtle** (`--accent-subtle`): the tint used for selected and local-user
  states — active theme chips, the local participant card, the settings tab
  background, hovered room and participant cards. It is the accent at panel
  weight, and it is what lets selection read without a border change.

### Neutral

- **Base** (`--bg-base`): the page and content-area ground; also the inset color
  for inputs and recessed controls sitting *on* a surface.
- **Surface** (`--bg-surface`): cards, panels, headers, modals, the sidebar.
  Pure white in every light theme; a lifted near-black in every dark one.
- **Muted** (`--bg-muted`): the recessed tone — the control tray, the level-meter
  well, disabled control backgrounds, the status-badge fill.
- **Text Primary** (`--text-primary`): names, headings, message bodies, values.
- **Text Secondary** (`--text-secondary`): section labels, field labels, inactive
  control glyphs, the user-info line.
- **Text Muted** (`--text-muted`): placeholders, hints, capacity counts, inactive
  nav items, disabled states.
- **Border** (`--border`): the hairline that does nearly all separation work in
  this system, at 1px on passive surfaces and 1.5px on interactive chrome.

### Tertiary

- **Avatar Hash Palette** (`#6366f1`, `#ec4899`, `#8b5cf6`, `#f59e0b`, `#10b981`,
  `#3b82f6`, and additionally `#0d9488`, `#e11d48` for room avatars): the one
  place raw hex is legitimate. A display name or room name is hashed to a stable
  index so the same person is the same color for everyone in the room, in every
  theme. These are identity tokens, not palette tokens — they are deliberately
  theme-independent so a participant's color doesn't shift when someone changes
  their own theme.

### Status (fixed — never themed)

- **Voice Green** (`#10b981`, `--success-500`): a mic is open or a peer is
  present. It carries the speaking ring, the connection pill, the online dot in
  the lobby popover, and the transmitting state of the mobile PTT button. This is
  the single most meaningful color in the product.
- **Failure Red** (`#ef4444`, `--error-500`): muted, deafened, at capacity,
  disconnected, destructive. Mute and deafen indicators, the full-room capacity
  bar and join button, error banners, the reconnect banner's border, the soft
  danger reset button.

### Named Rules

**The Eleven Tokens Rule.** No component may contain a raw color value. Every
background, text color, and border resolves to one of the eleven semantic
variables or to the two fixed status colors. The only sanctioned exceptions are
the avatar hash palette, `#fff` as the foreground on a filled accent, and the
`rgba(0,0,0,…)` scrims behind modals and the lightbox. A hex code appearing in a
new component is a bug, not a style choice — it will be correct in one theme and
wrong in seven.

**The Two Fixed Lights Rule.** Voice Green and Failure Red do not theme. They are
the only two colors that mean the same thing in all eight worlds, and that
constancy is what makes them readable as signals. Never re-map them per theme,
and never borrow them for anything that isn't a state report.

**The Tint, Don't Pick Rule.** Status backgrounds and status borders are derived,
not chosen: `color-mix(in srgb, var(--error-500) 12%, var(--bg-surface))` for
fills, `color-mix(in srgb, var(--success-500) 25%, transparent)` for borders. The
established mix percentages are 8–15% for fills and 25–35% for borders. Never
hand-pick a tint hex; it will only be right on one background.

**The One Loud Color Rule.** A single screen shows at most one accent-filled
element competing for attention. The room card's join button fills with accent
*on hover*, not at rest. The lobby's create-room button is the only accent fill in
the header. Filled accent is a call to act; more than one on screen and none of
them read.

## Typography

**Display / Body / Label Font:** Inter (with `-apple-system`, `BlinkMacSystemFont`,
`Segoe UI`, `Roboto`, sans-serif fallbacks), weights 400–900.
**Readout Font:** the platform `monospace` stack, used only for live numeric values.

**Character:** One family doing every job, separated entirely by weight and
tracking rather than by size. The type is *small* — the display size is only
30px and body text sits at 15px — and it compensates with a very wide weight
range (400 through 900) and heavy use of tracked uppercase for structural labels.
The result reads like instrument labelling: dense, confident, quiet.

### Hierarchy

- **Display** (800, `1.875rem`/30px, `-0.025em`): the join screen's title and the
  lobby's largest moment. Appears once per screen at most, and on many screens
  not at all.
- **Headline** (800, `1.125rem`/18px, `-0.025em`): modal titles, the room title
  in the header. The brand wordmark sits just under this at `1.0625rem`/800 with
  tighter `-0.03em` tracking.
- **Title** (600–700, `0.9375–1rem`): participant names, room card names, the
  keycap badge. Weight 500 for a participant's own name; 700 for a room card
  heading.
- **Body** (400, `0.9375rem`/15px, line-height 1.4–1.5): chat message content,
  empty-state copy, modal subtitles. Long-form copy is capped around `280px` in
  empty states — this system has no reading surfaces, so no wide measure exists.
- **Label** (700, `0.7–0.75rem`, `0.05em`, UPPERCASE): every section header,
  field label, and structural caption. This is the workhorse and the most
  characteristic type treatment in the system.
- **Micro-label** (600–900, `0.58–0.7rem`, `0.04–0.1em`, often UPPERCASE): bottom
  nav items, mode labels, capacity counts, badges, the PTT button's `TAP TO TALK`
  at weight 900 and `0.1em`. Tracking widens as size shrinks.
- **Readout** (700, `0.75rem`, monospace, accent-colored): live numeric values
  only — currently the noise-gate threshold. Monospace signals "this number is
  changing" and keeps the digits from jittering the layout.

### Named Rules

**The Shout in Small Rule.** Emphasis at small sizes comes from weight, case, and
letter-spacing — never from size. A label does not get bigger to matter more; it
goes to 700, uppercase, and `0.05em`. This is why the whole interface stays dense
without ever feeling shouty.

**The Tracking Inversion Rule.** Tracking runs opposite to size. Anything above
`1rem` tightens (`-0.025em` to `-0.03em`); anything below `0.75rem` opens up
(`0.05em` to `0.1em`). Never ship a tracked-out heading or a tight micro-label.

**The Ellipsis Always Rule.** Every user-supplied string — display names, room
names, participant names in the popover — is `white-space: nowrap` +
`overflow: hidden` + `text-overflow: ellipsis` inside a `min-width: 0` flex child.
Names are unvalidated and can be any length; nothing in this layout may grow to
fit one.

## Layout

**The two shells.** `LayoutService.isMobile` picks between a desktop shell and a
mobile shell — genuinely separate component trees, not one responsive layout.
Desktop is a full-height column: a `0.75rem 1.5rem` header bar on `--bg-surface`
with a bottom hairline, then a flex row of a fixed **320px** sidebar (roster on
top, controls in a bordered footer) beside a flexible content area on
`--bg-base`. Mobile is header → single active panel → a bottom nav of three
equal-flex tabs (Room / Chat / Settings), with only one panel mounted at a time.

**Height model.** Every full-screen container uses `100dvh`, never `100vh` —
mobile browser chrome collapsing would otherwise clip the bottom nav. All bottom
chrome adds `env(safe-area-inset-bottom)`; the reconnect banner adds
`env(safe-area-inset-top)`.

**The lobby.** A `max-width: 860px` centered column with `1rem` side padding that
opens to `2rem` at 600px. Room cards are a single-column flex stack below 580px
and an `auto-fill, minmax(260px, 1fr)` grid above it.

**Breakpoints.** The set is idiosyncratic and content-derived rather than
device-derived: **360px** (drop the "rooms" label), **380px** (buttons go
icon-only), **580px** (room grid engages), **600px** (lobby padding, card radius,
avatar size, modal centers instead of docking to the bottom), **640px** (join card
goes full-bleed), **768px** (chat loses its border and radius), **800px**
(participant popover flips from side to below).

**Spacing rhythm.** A 4px base, expressed in rem: `0.25 / 0.375 / 0.5 / 0.625 /
0.75 / 1 / 1.25 / 1.5 / 2 / 2.5rem`. Card interiors sit at `0.75–1.125rem`, panel
padding at `1–1.5rem`, and gaps between siblings at `0.5–1rem`. Density is high
throughout: this is a console, and whitespace is used to group, not to breathe.

### Named Rules

**The Ten Slot Rule.** The roster is capped at 10 participants server-side, so
every list in this system is bounded and short. Do not virtualize, do not
paginate, and do not design an overflow affordance for the participant list — the
constraint is real and permanent, and layouts may safely assume the whole list
fits.

**The Two Shells Rule.** Desktop and mobile are separate components by design.
When adding a feature to the room, it must be placed deliberately in both — a
change that appears only in `desktop-layout` is a half-shipped change.

## Elevation & Depth

The system is currently near-flat, and this is recorded as its present state
rather than as doctrine — depth is under-used here and a future pass may add
layering without contradicting this file.

Today, hairline borders do essentially all separation work. `--shadow-sm` sits on
cards, headers, and control buttons as a barely-perceptible seat. `--shadow-md`
and `--shadow-lg` are reserved for things genuinely floating above the page:
modals, the participant popover, the mobile PTT button, the join card. The only
color-bearing shadows are accent glows under the brand mark
(`0 3px 10px color-mix(in srgb, var(--accent) 35%, transparent)`) and the primary
button (`0 2px 8px … 30%`), plus a green glow under the transmitting PTT button.
The lobby adds two fixed blurred accent orbs (500px and 400px, `blur(80px)`, at
10% and 7% opacity) as atmosphere behind the content.

### Shadow Vocabulary

- **`--shadow-sm`** (`0 1px 2px 0 rgb(0 0 0 / 0.05)`): seated. Cards at rest,
  headers, control buttons, the keycap badge.
- **`--shadow-md`** (`0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`):
  lifted. Room card on hover, mobile PTT button, the reconnect banner.
- **`--shadow-lg`** (`0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`):
  floating. Modals, sheets, the participant popover, the join card.

### Named Rules

**The Shadow Means Airborne Rule.** A shadow is not decoration and not hierarchy.
It appears when an element is literally above the page (modal, popover, sheet) or
is responding to the pointer (`translateY(-1px)` plus a step up the ladder). A
surface that is merely important gets a border and a tone, not a shadow.

**The Scrim Pair Rule.** Overlays use exactly two established scrims:
`rgba(0,0,0,0.5)` with `backdrop-filter: blur(6px)` for modals, and
`rgba(0,0,0,0.92)` unblurred for the image lightbox. Do not introduce a third.

## Shapes

The form language is uniformly rounded with no sharp corners anywhere, and the
radius scales with the surface it wraps — a ladder from 4px to 20px, plus pills
and circles for anything that reads as a status or an identity.

- **4px** (`chip`): inline chips — the listen-only badge, the volume percentage,
  the popover count.
- **6px** (`inline`): small inline controls — the stream badge, info button, join
  button, tab tops.
- **8px** (`control`): the default for buttons, icon buttons, chat inputs, the
  keycap badge, the brand mark.
- **10px** (`field`): text inputs, the participant card, theme chips, the theme
  preview strip.
- **12px** (`card`): the chat panel, room cards, the control tray, the participants
  popover, chat bubbles.
- **14px** (`panel`): room cards at ≥600px, the empty state.
- **20px** (`sheet`): the mobile bottom sheet — top corners only
  (`20px 20px 0 0`), squaring off to `18px` all around when it centers at ≥600px.
- **9999px** (`pill`): status pills, the connection pill, capacity bars, the
  sheet's grab handle, the reconnect banner.
- **50%** (`circle`): avatars, the speaking ring, status dots, the mobile PTT button.

**Borders.** 1px on passive surfaces (cards, panels, dividers). **1.5px** on
interactive chrome (theme chips, join buttons, info buttons, device selects,
the keycap badge) — a subtle but consistent tell that an element can be pressed.
The keycap badge alone thickens its bottom edge to **3px**, the system's one
piece of literal skeuomorphism. Dashed 1.5px marks the empty state.

### Named Rules

**The Radius Ladder Rule.** Radius is a function of the element's size and role,
not a per-component choice: inline chips 4–6px, controls and fields 8–10px, cards
and panels 12–14px, sheets 20px, status and identity shapes fully round. A new
component picks its rung; it does not invent a value.

**The Chat Bubble Tail Rule.** Message bubbles keep 12px on three corners and
collapse to **2px** on the corner nearest their sender — bottom-left for remote,
bottom-right for local. This is the only asymmetric radius in the system and it
is what makes authorship readable without an avatar.

## Components

### Buttons

- **Shape:** rounded rectangle, 8px (`--rounded.control`), no sharp variants.
- **Primary:** accent fill, white text, `0.5rem 0.875rem` padding, weight 600 at
  `0.8125rem`, with an accent-tinted glow (`0 2px 8px … 30%`). Hover moves to
  `--accent-hover` and lifts `translateY(-1px)`. Disabled drops to `--bg-muted`
  on `--text-muted` and loses both the shadow and the lift.
- **Secondary:** surface fill, 1px border, primary text. Hover swaps the border to
  accent, the background to `--accent-subtle`, and the text to accent — the whole
  button warms rather than darkening.
- **Ghost:** no fill, no border, secondary text. Hover fills with `--bg-muted`.
  Used for modal cancels.
- **Danger-soft:** transparent fill, `color-mix(… error 35%, transparent)` border,
  Failure Red text; hover fills at 8%. Destructive actions never get a solid red
  fill in this system.
- **Icon button:** 36–40px square, base or surface fill, 1px border, `0.5rem`
  radius. Hover warms the border to accent. The active state fills with accent
  and flips the glyph to white.
- **Transitions:** `all 0.2s` across the board; `0.15s` on tabs and theme chips.

### Voice Controls

The signature component. Three 48px square buttons sit inside a **recessed tray**
— `--bg-muted` background, 4px padding, 12px radius, 4px gaps — so the controls
read as seated *in* the surface rather than on it. Each button is
`--bg-surface` with `--shadow-sm` and no border.

- **Active (mic open):** glyph goes Voice Green. Background unchanged.
- **Muted / deafened:** glyph goes Failure Red and the background mixes in 12%
  red (`color-mix(in srgb, var(--error-500) 12%, var(--bg-surface))`).
- **PTT toggle:** when on, inverts fully — `--text-primary` fill with
  `--bg-surface` glyph. The one intentional inversion in the system.
- **Disabled (listen-only):** 50% opacity, `--bg-muted` fill, `not-allowed`
  cursor, and a `title` explaining why.
- **Mobile PTT:** a 140px circle with an 8px `--bg-base` ring, holding a stacked
  mic glyph and a 900-weight `TAP TO TALK` label. Transmitting inverts the fill to
  `--text-primary`, turns the glyph Voice Green, scales to `0.95`, and adds a
  green glow. Every toggle fires `navigator.vibrate(15)`.

### Participant Card

- **Shape:** 10px radius, 1px border, `0.75rem` padding, `0.75rem` gap.
- **Avatar:** 38px circle, hash-assigned from the avatar palette, white 600-weight
  initial.
- **Speaking:** a 2px Voice Green ring inset `-3px` around the avatar, pulsing
  `scale(0.95) → 1.1` over 1.5s on `cubic-bezier(0.24, 0, 0.38, 1)`, fading out as
  it grows.
- **Local user:** permanently `--accent-subtle`, `cursor: default`, and hover-inert
  — you cannot open a volume control on yourself.
- **Status row:** mute and deafen glyphs in Failure Red at 16px, a `Listen-only`
  badge in `--bg-muted`, and a volume percentage chip in accent — shown only when
  volume is not 100%.
- **Hover (remote only):** border to accent, background to `--accent-subtle`.

### Room Card

- **Shape:** 12px radius (14px at ≥600px), 1px border, `--shadow-sm`.
- **Contents:** a 38–42px squircle avatar (9–10px radius) hash-colored from the
  room name, the room name at 700, and a meta row pairing a **3px capacity bar**
  with a count.
- **Capacity:** the bar fills with accent and switches to Failure Red at capacity;
  the join button simultaneously switches to a red-tinted disabled treatment.
- **Hover:** border to accent, shadow to `--shadow-md`, `translateY(-2px)` at
  ≥600px only, and the join button fills with accent — a nested state change that
  makes the whole card read as one target.

### Inputs / Fields

- **Style:** `--bg-base` fill on a `--bg-surface` parent (inputs are always
  *recessed* relative to their container), 1px border, 10px radius,
  `0.75rem 1rem` padding, 16px text to prevent iOS zoom-on-focus.
- **Focus:** `outline: 2px solid var(--accent)` with `border-color: transparent`
  — the accent ring replaces the border rather than stacking on it.
- **Disabled:** `--bg-muted` fill, `--text-muted` text, `not-allowed`.
- **Label:** always above, always uppercase Label type in `--text-secondary`.
- **Chat input** is the one variant: 8px radius, border-color-only focus, paired
  with a 40px square accent send button.

### Navigation

- **Desktop:** no nav — the header carries the brand mark, room title, user name,
  and a row of icon buttons.
- **Mobile bottom nav:** three equal-flex tabs on `--bg-surface` with a top
  hairline and `env(safe-area-inset-bottom)` padding. Each is a stacked 20px
  stroke icon over a 0.65rem/600 uppercase label, `--text-muted` at rest and
  accent when active.
- **Settings tabs:** underline tabs — a 2px transparent bottom border that goes
  accent when active, paired with an `--accent-subtle` fill and 6px top corners.

### Status Pills & Badges

- **Connection pill:** fully round, `color-mix(… success 15%, surface)` fill,
  25% success border, Voice Green 600-weight text, preceded by an 8px dot. The dot
  carries explicit `min-width`/`min-height` — flex was squashing it.
- **Rooms-online badge:** same construction at smaller scale, with the dot on a
  2s opacity blink.
- **Reconnect banner:** a fixed, centered, fully-round surface pill with a
  red-mixed border and `--shadow-md`, holding a dot, the reason, and a Leave
  button. It never blocks the room beneath it.
- **Listen-only badge:** 10px/600 uppercase-adjacent text in `--bg-muted` at 4px
  radius.

### Keycap Badge

The PTT key binding renders as a physical keycap: `--bg-surface` fill, **1.5px**
border with a **3px** bottom edge, 8px radius, 800-weight 16px text, `min-width:
80px`, centered, with `--shadow-sm`. It is the system's one deliberate piece of
skeuomorphism and it earns its place — it tells you instantly that the value is a
key you press, not a setting you type.

### Theme Chip

A 4-column grid of chips, each a 28px circle split vertically into background and
accent halves over a 0.58rem label. Selected state: accent border, `--accent-subtle`
fill, `box-shadow: 0 0 0 2px var(--accent)`, and an accent label. Grouped under
tracked `Light` / `Dark` micro-labels. The chip is a live preview — it shows the
two colors that actually change.

### Chat Bubbles

Remote bubbles are `--bg-surface` with a 1px border and primary text; local
bubbles fill with accent and go white with a transparent border. Both cap at
**75%** of the column width, carry a 0.7rem uppercase header row at 70% opacity
pairing sender and time, and use the asymmetric 2px tail corner described in
Shapes. Links are accent and underlined; inside a local bubble they go white at
85% opacity.

### Named Rules

**The Mute Wins Rule.** When a participant is both muted and producing audio, the
mute indicator shows and the speaking ring is suppressed. State that constrains
takes visual priority over state that merely reports. This is a product invariant,
not a styling preference.

**The Disabled Says Why Rule.** Every disabled control carries a `title`
explaining the reason — "Microphone unavailable", "You are sharing", "PTT Active".
A control that is dimmed without an explanation is an unfinished control.

**The Recessed Input Rule.** Inputs and trays are always one tone *below* their
container: `--bg-base` inside a `--bg-surface` panel, `--bg-muted` for the control
tray and meter well. Nothing interactive floats above its parent's tone.

## Do's and Don'ts

### Do:

- **Do** route every color through the eleven semantic tokens, and verify a new
  component in at least one light and one dark theme before calling it done —
  Purple and Obsidian are the widest-apart pair.
- **Do** use `color-mix(in srgb, var(--success-500) N%, …)` for status tints, at
  the established 8–15% for fills and 25–35% for borders.
- **Do** reach for weight, uppercase, and `0.05em` tracking when something small
  needs emphasis, and leave the size alone.
- **Do** give every user-supplied string `min-width: 0` + nowrap + ellipsis.
- **Do** pair every disabled state with a `title` that says why.
- **Do** use `100dvh` and `env(safe-area-inset-*)` on anything full-height or
  bottom-anchored.
- **Do** put new room features in **both** `desktop-layout` and `mobile-layout`.
- **Do** keep interactive borders at 1.5px and passive ones at 1px.

### Don't:

- **Don't** write a raw hex value in a component. The avatar hash palette, `#fff`
  on accent fills, and the two overlay scrims are the only exceptions.
- **Don't** re-map Voice Green or Failure Red per theme, or borrow either for
  anything that isn't a state report.
- **Don't** place more than one accent-filled element on a screen at rest.
- **Don't** add a shadow to convey importance — use a border and a tone. Shadows
  mean airborne or hovered.
- **Don't** invent a radius. Pick a rung on the ladder (4/6/8/10/12/14/20/pill).
- **Don't** design an overflow or virtualization affordance for the participant
  list; it is capped at 10 forever.
- **Don't** use `100vh`, and don't let bottom chrome ignore the safe-area inset.
- **Don't** introduce a third overlay scrim.

### The Background Tab Rule

This one deserves its own heading because it is the constraint most likely to be
missed. A single class, `.app-background`, is applied when the tab is not in the
foreground, and it force-disables **every** animation, transition, caret,
`backdrop-filter`, speaking-ring glow, and `will-change` in the app. The usage
scene is hours-long ambient sessions in a background tab, and this switch is what
keeps that cheap.

So: any motion, blur, or glow you add must be *switchable off by that class* and
the UI must remain fully legible without it. If a component only communicates
through animation — a state that is readable only while something is pulsing —
it will be silent for most of its actual lifetime. Encode state in color, glyph,
and border first; let motion be the amplifier, never the message.
