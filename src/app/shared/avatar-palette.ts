/**
 * Identity colors for participant and room avatars.
 *
 * These are the one sanctioned place in the app where a literal color is
 * correct: a name is hashed to a stable index so the same person reads as the
 * same color for everyone, in every theme. They are identity, not palette.
 *
 * Two constraints shaped this set:
 *
 * 1. **White initials must be readable.** Every swatch clears 4.5:1 against
 *    #ffffff. The previous set did not — #f59e0b sat at 2.15:1 and #ec4899 at
 *    3.53:1, so a third of participants had effectively unreadable initials.
 *
 * 2. **No green, no red.** Those hues carry state in this system (a mic that is
 *    open, a user who is muted). The old set contained #10b981 — Voice Green
 *    itself — so a participant could be tinted the exact color that means
 *    "this person is speaking".
 */
export const AVATAR_COLORS = [
  '#6368e7', // indigo
  '#cf3c85', // magenta
  '#845be7', // violet
  '#b45309', // amber
  '#3273de', // blue
  '#0f766e', // teal
  '#0e7490', // cyan
  '#7e22ce', // purple
] as const;

/** Stable, order-independent color for a display name or room name. */
export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
