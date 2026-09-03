import { describe, it, expect } from 'vitest';
import {
  AVATARS,
  AVATAR_IDS,
  FEATURE_INK,
  avatarDef,
  avatarForName,
  isAvatarId,
  resolveAvatarId,
} from './avatars';

const hex = /^#[0-9a-f]{6}$/;

// Relative luminance / contrast, mirroring scripts/check-contrast.mjs. Kept here
// so a bad palette fails the unit run too, not only the release gate.
const toRgb = (h: string) =>
  [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = (h: string) => {
  const [r, g, b] = toRgb(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
  return (hi + 0.05) / (lo + 0.05);
};
const hue = (h: string) => {
  const [r, g, b] = toRgb(h);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return 0;
  const x = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (x * 60 + 360) % 360;
};

describe('avatar catalogue', () => {
  it('has one entry per id, with well-formed colours', () => {
    expect(AVATARS.length).toBe(AVATAR_IDS.length);
    expect(new Set(AVATARS.map(a => a.id)).size).toBe(AVATARS.length);
    for (const a of AVATARS) {
      expect(a.ink).toMatch(hex);
      expect(a.skin).toMatch(hex);
      expect(a.name.length).toBeGreaterThan(0);
    }
  });

  it('keeps every ink and skin unique', () => {
    expect(new Set(AVATARS.map(a => a.ink)).size).toBe(AVATARS.length);
    expect(new Set(AVATARS.map(a => a.skin)).size).toBe(AVATARS.length);
  });

  it('draws readable features on every skin and a head that separates from its frame', () => {
    for (const a of AVATARS) {
      expect(ratio(FEATURE_INK, a.skin), `features on ${a.id}`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(a.skin, a.ink), `head against frame for ${a.id}`).toBeGreaterThanOrEqual(2.2);
    }
  });

  it('contains no green and no red hue', () => {
    // Those hues report state in this app — an open mic, a muted user. A
    // participant must never be tinted the colour that means "speaking".
    for (const a of AVATARS) {
      for (const c of [a.ink, a.skin]) {
        const h = hue(c);
        expect(h > 85 && h < 155, `${a.id} ${c} sits in the green band`).toBe(false);
        expect(h > 345 || h < 20, `${a.id} ${c} sits in the red band`).toBe(false);
      }
    }
  });
});

describe('avatarForName', () => {
  it('is stable for the same name', () => {
    expect(avatarForName('Alice')).toBe(avatarForName('Alice'));
  });

  it('always lands on a real avatar', () => {
    for (const n of ['', 'A', 'Пётр', 'Brave Badger', 'x'.repeat(20)]) {
      expect(AVATAR_IDS).toContain(avatarForName(n));
    }
  });
});

describe('resolveAvatarId', () => {
  it('prefers an explicit, known id', () => {
    expect(resolveAvatarId('drunk', 'Alice')).toBe('drunk');
  });

  it('falls back to the name-derived default for anything unknown', () => {
    // The server validates shape only, so an id it has never heard of has to
    // resolve to something drawable rather than to a blank card.
    const expected = avatarForName('Alice');
    expect(resolveAvatarId('', 'Alice')).toBe(expected);
    expect(resolveAvatarId(null, 'Alice')).toBe(expected);
    expect(resolveAvatarId(undefined, 'Alice')).toBe(expected);
    expect(resolveAvatarId('eleventh-avatar', 'Alice')).toBe(expected);
  });
});

describe('isAvatarId', () => {
  it('accepts catalogue ids and rejects everything else', () => {
    expect(isAvatarId('cheerful')).toBe(true);
    expect(isAvatarId('nope')).toBe(false);
    expect(isAvatarId(null)).toBe(false);
    expect(isAvatarId('')).toBe(false);
  });
});

describe('avatarDef', () => {
  it('resolves every id', () => {
    for (const id of AVATAR_IDS) expect(avatarDef(id).id).toBe(id);
  });
});
