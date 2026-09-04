import { hashName } from './avatar-palette';

/**
 * The ten avatars.
 *
 * In the UI these are «уебища»; in code they are avatars, everywhere, without
 * exception. The Russian word exists only in `name` and in the picker's copy.
 *
 * Each avatar carries two colors, not one:
 *
 * - **ink** — the deep tone. It fills the portrait's frame and drives the
 *   participant card's tint and border through `color-mix`.
 * - **skin** — the mid tone. It fills the head, and the face features are drawn
 *   on it in near-black.
 *
 * That split is what makes the features legible: the reference direction draws
 * dark eyes and mouth, so the head has to be light — the opposite of the old
 * white-initial-on-color avatar, and the reason `check-contrast.mjs` asserts
 * `FEATURE_INK` against `skin` rather than white against `ink`.
 *
 * Three constraints shaped the palette, and a new entry must satisfy all three:
 *
 * 1. **No green, no red.** Those hues report state here — an open mic, a muted
 *    user. A participant must never be tinted the color that means "speaking".
 * 2. **Muted, not loud.** Ten saturated cards turn the roster into noise. Mean
 *    chroma sits near 33; the first attempt at 62 was unusable.
 * 3. **Perceptually distinct.** Minimum ΔE across the set is 19 for ink and 18
 *    for skin. Excluding green and red leaves barely half the hue wheel, so
 *    lightness carries as much of the separation as hue does.
 */
export const AVATAR_IDS = [
  'cheerful',
  'playful',
  'pompous',
  'sly',
  'scared',
  'angry',
  'sad',
  'sleepy',
  'dumb',
  'drunk',
] as const;

export type FixedAvatarId = (typeof AVATAR_IDS)[number];

/**
 * A rolled avatar, carrying its own seed: `random-7f3a9c`.
 *
 * The seed lives in the id rather than in a random number generated at render
 * time, and that is the whole design. Everything downstream is derived from it,
 * so every client draws the same face for the same person — a locally rolled
 * face would make one participant look different in every other window.
 *
 * It also means the server needs no change at all: the shape still satisfies its
 * `^[a-z][a-z0-9-]{0,23}$` whitelist, so it travels through Join, survives a
 * reconnect and persists to localStorage exactly like a fixed id.
 */
export type RandomAvatarId = `random-${string}`;

export type AvatarId = FixedAvatarId | RandomAvatarId;

export const RANDOM_PREFIX = 'random-';
const RANDOM_RE = /^random-[a-z0-9]{4,12}$/;

/** Which primitive to draw for each part of a rolled face. */
export interface AvatarTraits {
  readonly eyes: number;
  readonly mouth: number;
  readonly brow: number;
  readonly hat: number;
}

/** Pool sizes, mirrored by the @switch blocks in AvatarFaceComponent. */
export const TRAIT_POOL = { eyes: 6, mouth: 6, brow: 4, hat: 6 } as const;

export interface AvatarDef {
  readonly id: AvatarId;
  /** Full name, shown in `title` and `aria-label`. */
  readonly name: string;
  /** The adjective alone — all a picker tile has room for. */
  readonly short: string;
  /** Deep tone: portrait frame, card tint and border. */
  readonly ink: string;
  /** Mid tone: the head the dark features are drawn on. */
  readonly skin: string;
  /** Present only on rolled avatars; the ten fixed ones are drawn bespoke. */
  readonly traits?: AvatarTraits;
}

export const AVATARS: readonly AvatarDef[] = [
  { id: 'cheerful', name: 'Весёлое уебище', short: 'Весёлое', ink: '#93674d', skin: '#d9b191' },
  { id: 'playful', name: 'Игривое уебище', short: 'Игривое', ink: '#8a3364', skin: '#c47ea5' },
  { id: 'pompous', name: 'Пафосное уебище', short: 'Пафосное', ink: '#7c6d31', skin: '#ccb661' },
  { id: 'sly', name: 'Хитрое уебище', short: 'Хитрое', ink: '#7b518a', skin: '#bd82e3' },
  { id: 'scared', name: 'Испуганное уебище', short: 'Испуганное', ink: '#4b519b', skin: '#8694c1' },
  { id: 'angry', name: 'Злое уебище', short: 'Злое', ink: '#433762', skin: '#a792d8' },
  { id: 'sad', name: 'Грустное уебище', short: 'Грустное', ink: '#4e76b1', skin: '#a1b8ce' },
  { id: 'sleepy', name: 'Сонное уебище', short: 'Сонное', ink: '#265278', skin: '#329dcd' },
  { id: 'dumb', name: 'Тупое уебище', short: 'Тупое', ink: '#327d9a', skin: '#72c1cb' },
  { id: 'drunk', name: 'Пьяное уебище', short: 'Пьяное', ink: '#297a69', skin: '#66c7b2' },
];

/** The near-black every face feature is drawn in. */
export const FEATURE_INK = '#2b2b2b';

/**
 * Illustration colours used inside the portraits.
 *
 * These are not identity — they are the paint the drawing is made of, shared by
 * every avatar that needs them. They live here rather than inline in the
 * component for the same reason the ink/skin pairs do: a literal repeated eleven
 * times across a template is a literal that will drift.
 */
export const PORTRAIT_PAINT = {
  /** Collar and light headwear. */
  linen: '#f2ede6',
  /** Tongues, and the crease down them. */
  tongue: '#ef7f96',
  tongueCrease: '#b9455f',
  /** The sad avatar's tear. */
  tear: '#6fa8dc',
  /** The drunk avatar's flush. */
  flush: '#c0392b',
} as const;

/** Neutral pair a muted participant's portrait is repainted with. */
export const MUTED_INK = '#8d8781';
export const MUTED_SKIN = '#a9a29c';

const BY_ID = new Map<string, AvatarDef>(AVATARS.map(a => [a.id, a]));

export function isFixedAvatarId(value: string | null | undefined): value is FixedAvatarId {
  return !!value && BY_ID.has(value);
}

export function isRandomAvatarId(value: string | null | undefined): value is RandomAvatarId {
  return !!value && RANDOM_RE.test(value);
}

export function isAvatarId(value: string | null | undefined): value is AvatarId {
  return isFixedAvatarId(value) || isRandomAvatarId(value);
}

// ── Rolled avatars ──────────────────────────────────────────────────────────

/** Deterministic PRNG, so a seed yields one face and not a family of them. */
function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const srgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const luminance = (hex: string) => {
  const [r, g, b] = srgb(hex).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
function contrast(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
function hsl(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360 / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 0.5) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const to = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');
  return `#${to(f(h + 1 / 3))}${to(f(h))}${to(f(h - 1 / 3))}`;
}

/** A fresh id. The only place randomness is drawn — after this it is a value. */
export function newRandomAvatarId(): RandomAvatarId {
  const seed = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
  return `${RANDOM_PREFIX}${seed}` as RandomAvatarId;
}

/**
 * Build a rolled avatar from its id.
 *
 * The colours are generated, then *checked and corrected* against the same two
 * rules the fixed palette obeys — dark features readable on the skin, the head
 * separable from its frame. A generator that merely hoped to land in range would
 * ship an unreadable face the first time someone rolled a bad number; instead the
 * lightness is walked in fixed steps until both hold, deterministically, so every
 * client still agrees on the result.
 *
 * Hue is drawn from the two arcs that exclude green and red, because those report
 * state here and a rolled avatar is no more entitled to them than a fixed one.
 */
export function randomAvatarDef(id: RandomAvatarId): AvatarDef {
  const rnd = mulberry32(hashName(id));

  // The wheel minus the state hues is 20–85 and 155–345, but the skin hue is
  // jittered +/-5 below, so sample from arcs inset by that margin. Sampling the
  // full arc let a hue at the boundary drift into the green band — caught by the
  // 500-seed spec, which is exactly the failure a generator hides until someone
  // rolls a bad number in production.
  const span = rnd() * 226;
  const hue = span < 50 ? 28 + span : 162 + (span - 50);

  const inkS = 0.3 + rnd() * 0.16;
  const skinS = 0.34 + rnd() * 0.2;
  let inkL = 0.28 + rnd() * 0.12;
  let skinL = 0.54 + rnd() * 0.12;
  const skinHue = hue + (rnd() * 10 - 5);

  let ink = hsl(hue, inkS, inkL);
  let skin = hsl(skinHue, skinS, skinL);

  // Lighten the head until the near-black features clear AA on it.
  for (let i = 0; i < 24 && contrast(FEATURE_INK, skin) < 4.5; i++) {
    skinL = Math.min(0.82, skinL + 0.02);
    skin = hsl(skinHue, skinS, skinL);
  }
  // Then darken the frame until the head keeps a silhouette against it.
  for (let i = 0; i < 24 && contrast(skin, ink) < 2.2; i++) {
    inkL = Math.max(0.14, inkL - 0.02);
    ink = hsl(hue, inkS, inkL);
  }

  return {
    id,
    name: 'Рандомное уебище',
    short: 'Рандомное',
    ink,
    skin,
    traits: {
      eyes: Math.floor(rnd() * TRAIT_POOL.eyes),
      mouth: Math.floor(rnd() * TRAIT_POOL.mouth),
      brow: Math.floor(rnd() * TRAIT_POOL.brow),
      hat: Math.floor(rnd() * TRAIT_POOL.hat),
    },
  };
}

/**
 * The avatar a name gets before anyone picks one.
 *
 * Deterministic on purpose: every client derives the same face from the same
 * display name with no round trip, so nobody ever sees a placeholder — and a
 * participant looks the same to everyone even before their choice arrives.
 */
export function avatarForName(displayName: string): FixedAvatarId {
  return AVATAR_IDS[hashName(displayName) % AVATAR_IDS.length];
}

/**
 * What to draw for a participant.
 *
 * An unrecognised id falls back to the name-derived default rather than to a
 * blank. That is what lets the server treat the value as an opaque slug: it
 * validates shape only, so adding an eleventh avatar stays a client-only change.
 */
export function resolveAvatarId(avatar: string | null | undefined, displayName: string): AvatarId {
  return isAvatarId(avatar) ? avatar : avatarForName(displayName);
}

export function avatarDef(id: AvatarId): AvatarDef {
  return isRandomAvatarId(id) ? randomAvatarDef(id) : BY_ID.get(id)!;
}
