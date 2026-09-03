#!/usr/bin/env node
/**
 * Contrast gate for the theme table.
 *
 * Every theme in src/styles.css is parsed and its token pairs are checked
 * against WCAG AA. Run it in CI or before a release: a new theme cannot ship
 * with an unreadable pair, which is exactly how the app came to have seven
 * themes whose primary button failed (Obsidian sat at 1.78:1 — a user could
 * not read their own chat bubble).
 *
 *   node scripts/check-contrast.mjs
 *
 * Exits 1 on any failure.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/styles.css'), 'utf8');

const hex2rgb = h => {
  h = h.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
};
const lin = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = rgb => { const [r, g, b] = rgb.map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => {
  const l1 = lum(hex2rgb(a)), l2 = lum(hex2rgb(b));
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
};

// Room identity colors still carry white initials in the lobby; keep them here.
const ROOM_AVATAR = ['#6368e7', '#cf3c85', '#845be7', '#b45309', '#3273de', '#0f766e', '#0e7490', '#7e22ce'];

// Participant avatars are two-tone portraits, so the assertion is not the one
// above. Features are drawn near-black on the *skin*, and the skin has to stay
// separable from the *ink* frame behind it or the head loses its silhouette.
// Parsed from the catalogue rather than copied: a duplicated palette is a
// palette that will disagree with itself.
const avatarsSrc = readFileSync(join(root, 'src/app/shared/avatars.ts'), 'utf8');
const FEATURE_INK = (avatarsSrc.match(/FEATURE_INK\s*=\s*'(#[0-9a-fA-F]{6})'/) || [])[1];
const AVATARS = [...avatarsSrc.matchAll(
  /id:\s*'([a-z]+)'[^}]*?ink:\s*'(#[0-9a-fA-F]{6})',\s*skin:\s*'(#[0-9a-fA-F]{6})'/g
)].map(m => ({ id: m[1], ink: m[2], skin: m[3] }));

const themes = [];
const blockRe = /(?:^|\n)(?::root,\s*\[data-theme="([\w-]+)"\]|\[data-theme="([\w-]+)"\])\s*\{([^}]*)\}/g;
let m;
while ((m = blockRe.exec(css))) {
  const name = m[1] || m[2];
  const vars = {};
  for (const line of m[3].split('\n')) {
    const t = line.match(/--([\w-]+):\s*(#[0-9a-fA-F]{3,8})/);
    if (t) vars['--' + t[1]] = t[2];
  }
  if (vars['--accent']) themes.push({ name, vars });
}

if (themes.length === 0) {
  console.error('check-contrast: no theme blocks found in src/styles.css');
  process.exit(1);
}

/** [label, foreground token, background token, minimum] */
const PAIRS = [
  ['on-accent / accent',       '--on-accent',      '--accent',       4.5],
  ['on-accent / accent-hover', '--on-accent',      '--accent-hover', 4.5],
  ['text-primary / surface',   '--text-primary',   '--bg-surface',   4.5],
  ['text-primary / base',      '--text-primary',   '--bg-base',      4.5],
  ['text-secondary / surface', '--text-secondary', '--bg-surface',   4.5],
  ['text-secondary / base',    '--text-secondary', '--bg-base',      4.5],
  ['text-muted / surface',     '--text-muted',     '--bg-surface',   4.5],
  ['text-muted / base',        '--text-muted',     '--bg-base',      4.5],
  ['success / surface',        '--success-500',    '--bg-surface',   4.5],
  ['success / base',           '--success-500',    '--bg-base',      4.5],
  ['error / surface',          '--error-500',      '--bg-surface',   4.5],
  ['error / base',             '--error-500',      '--bg-base',      4.5],
  // non-text: borders and separators
  ['border / surface',         '--border',         '--bg-surface',   3.0],
  ['border / base',            '--border',         '--bg-base',      3.0],
];

let failures = 0;
let checks = 0;

for (const { name, vars } of themes) {
  const bad = [];
  for (const [label, fg, bg, min] of PAIRS) {
    if (!vars[fg] || !vars[bg]) {
      bad.push(`${label}: missing ${!vars[fg] ? fg : bg}`);
      continue;
    }
    checks++;
    const r = ratio(vars[fg], vars[bg]);
    if (r < min) bad.push(`${label} ${r.toFixed(2)}:1 (need ${min})`);
  }
  if (bad.length) {
    failures += bad.length;
    console.error(`✗ ${name}`);
    for (const b of bad) console.error(`    ${b}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

// Room avatar initials are always white, in every theme.
const roomBad = ROOM_AVATAR.filter(c => ratio('#ffffff', c) < 4.5);
checks += ROOM_AVATAR.length;
if (roomBad.length) {
  failures += roomBad.length;
  console.error(`✗ room palette: white initials fail on ${roomBad.join(', ')}`);
} else {
  console.log(`✓ room palette (${ROOM_AVATAR.length} swatches)`);
}

if (!FEATURE_INK || AVATARS.length === 0) {
  console.error('check-contrast: could not parse the avatar catalogue from src/app/shared/avatars.ts');
  process.exit(1);
}

const avatarBad = [];
for (const { id, ink, skin } of AVATARS) {
  checks += 2;
  const feature = ratio(FEATURE_INK, skin);
  const silhouette = ratio(skin, ink);
  if (feature < 4.5) avatarBad.push(`${id}: features on skin ${feature.toFixed(2)}:1 (need 4.5)`);
  if (silhouette < 2.2) avatarBad.push(`${id}: head against frame ${silhouette.toFixed(2)}:1 (need 2.2)`);
}
if (avatarBad.length) {
  failures += avatarBad.length;
  console.error('✗ avatar portraits');
  for (const b of avatarBad) console.error(`    ${b}`);
} else {
  console.log(`✓ avatar portraits (${AVATARS.length} two-tone pairs)`);
}

console.log(`\n${checks} pairs checked across ${themes.length} themes.`);
if (failures) {
  console.error(`${failures} contrast failure(s). See DESIGN.md → Colors.`);
  process.exit(1);
}
console.log('All pairs meet WCAG AA.');
