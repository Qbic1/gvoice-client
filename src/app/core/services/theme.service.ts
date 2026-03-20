import { Injectable, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeId =
  | 'purple'
  | 'dark-purple'
  | 'ocean'
  | 'dark-ocean'
  | 'rose'
  | 'noir'
  | 'amber'
  | 'obsidian';

export interface Theme {
  id: ThemeId;
  label: string;
  icon: string;
  swatches: [string, string]; // [bg, accent]
}

export const THEMES: Theme[] = [
  // ── Light themes ──────────────────────────────
  {
    id: 'purple',
    label: 'Purple',
    icon: '🪻',
    swatches: ['#faf5ff', '#7c3aed'],
  },
  {
    id: 'ocean',
    label: 'Ocean',
    icon: '🌊',
    swatches: ['#f0fdfa', '#0d9488'],
  },
  {
    id: 'rose',
    label: 'Rose',
    icon: '🌸',
    swatches: ['#fff1f2', '#e11d48'],
  },
  {
    id: 'amber',
    label: 'Amber',
    icon: '🌅',
    swatches: ['#fffbeb', '#d97706'],
  },

  // ── Dark themes ───────────────────────────────
  {
    id: 'dark-purple',
    label: 'Dark Purple',
    icon: '🔮',
    swatches: ['#0f0a1e', '#a78bfa'],
  },
  {
    id: 'dark-ocean',
    label: 'Dark Ocean',
    icon: '🌌',
    swatches: ['#020c14', '#06b6d4'],
  },
  {
    id: 'noir',
    label: 'Noir',
    icon: '🖤',
    swatches: ['#0d0d0d', '#f43f5e'],
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    icon: '🌑',
    swatches: ['#0a0a0f', '#ffb347'],
  },
];

const STORAGE_KEY = 'gvoice-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);

  private readonly _theme = signal<ThemeId>(this.init());
  readonly theme = this._theme.asReadonly();

  setTheme(id: ThemeId): void {
    this._theme.set(id);
    this.doc.documentElement.setAttribute('data-theme', id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  init(): ThemeId {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    const valid = THEMES.map(t => t.id);
    const id: ThemeId =
      saved && valid.includes(saved as ThemeId) ? (saved as ThemeId) : 'purple';
    this.doc.documentElement.setAttribute('data-theme', id);
    return id;
  }
}