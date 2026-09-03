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

export type AvatarId = (typeof AVATAR_IDS)[number];

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

export function isAvatarId(value: string | null | undefined): value is AvatarId {
  return !!value && BY_ID.has(value);
}

/**
 * The avatar a name gets before anyone picks one.
 *
 * Deterministic on purpose: every client derives the same face from the same
 * display name with no round trip, so nobody ever sees a placeholder — and a
 * participant looks the same to everyone even before their choice arrives.
 */
export function avatarForName(displayName: string): AvatarId {
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
  return BY_ID.get(id)!;
}
