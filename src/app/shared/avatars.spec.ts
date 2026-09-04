import { describe, it, expect } from 'vitest';
import {
  AVATARS,
  AVATAR_IDS,
  FEATURE_INK,
  RandomAvatarId,
  TRAIT_POOL,
  avatarDef,
  avatarForName,
  isAvatarId,
  isRandomAvatarId,
  newRandomAvatarId,
  randomAvatarDef,
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

describe('rolled avatars', () => {
  // The exact whitelist SignalingHub.NormalizeAvatar applies. Duplicated across
  // the two repos with nothing checking it, so assert it here: a rolled id that
  // fails this is silently dropped to empty by the server and the avatar
  // vanishes for everyone but its owner.
  const SERVER_SLUG = /^[a-z][a-z0-9-]{0,23}$/;

  it('mints ids the server will accept', () => {
    for (let i = 0; i < 200; i++) {
      const id = newRandomAvatarId();
      expect(id, id).toMatch(SERVER_SLUG);
      expect(id.length).toBeLessThanOrEqual(24);
      expect(isRandomAvatarId(id)).toBe(true);
      expect(isAvatarId(id)).toBe(true);
    }
  });

  it('is deterministic: one seed, one face', () => {
    // The whole reason the seed lives in the id. If this drifts, a participant
    // looks different in every other client's window.
    const id = newRandomAvatarId();
    expect(randomAvatarDef(id)).toEqual(randomAvatarDef(id));
    expect(avatarDef(id)).toEqual(randomAvatarDef(id));
  });

  it('gives different seeds different faces', () => {
    const defs = Array.from({ length: 60 }, () => randomAvatarDef(newRandomAvatarId()));
    const shapes = new Set(defs.map(d => `${d.ink}|${d.skin}|${JSON.stringify(d.traits)}`));
    expect(shapes.size).toBeGreaterThan(50);
  });

  it('never rolls an unreadable or state-coloured face', () => {
    // Generated colours are corrected against the same two rules the fixed
    // palette obeys, so this holds for every seed rather than most of them.
    for (let i = 0; i < 500; i++) {
      const id = newRandomAvatarId();
      const d = randomAvatarDef(id);

      expect(ratio(FEATURE_INK, d.skin), `features on ${id} (${d.skin})`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(d.skin, d.ink), `head against frame on ${id}`).toBeGreaterThanOrEqual(2.2);

      for (const c of [d.ink, d.skin]) {
        const h = hue(c);
        expect(h > 85 && h < 155, `${id} ${c} is green`).toBe(false);
        expect(h > 345 || h < 20, `${id} ${c} is red`).toBe(false);
      }
    }
  });

  it('keeps every trait inside its pool', () => {
    for (let i = 0; i < 300; i++) {
      const t = randomAvatarDef(newRandomAvatarId()).traits!;
      expect(t.eyes).toBeGreaterThanOrEqual(0);
      expect(t.eyes).toBeLessThan(TRAIT_POOL.eyes);
      expect(t.mouth).toBeLessThan(TRAIT_POOL.mouth);
      expect(t.brow).toBeLessThan(TRAIT_POOL.brow);
      expect(t.hat).toBeLessThan(TRAIT_POOL.hat);
    }
  });

  it('passes a rolled id through resolveAvatarId untouched', () => {
    const id = newRandomAvatarId();
    expect(resolveAvatarId(id, 'Alice')).toBe(id);
    // ...but a malformed one still falls back rather than drawing a blank.
    expect(resolveAvatarId('random-NOPE' as RandomAvatarId, 'Alice')).toBe(avatarForName('Alice'));
  });
});
