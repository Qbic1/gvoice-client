import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

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
}

/*
 * Swatches deliberately carry no color values. They used to hold a hardcoded
 * [bg, accent] pair copied from styles.css, which drifted the moment the tokens
 * changed: after the contrast pass, Ocean and Amber advertised accents the
 * themes no longer used. The chip now stamps `data-theme` on itself and reads
 * --bg-base and --accent through the cascade, so a swatch cannot disagree with
 * the theme it previews.
 */

export const THEMES: Theme[] = [
  // ── Light themes ──────────────────────────────
  {
    id: 'purple',
    label: 'Purple',
    icon: '🪻',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    icon: '🌊',
  },
  {
    id: 'rose',
    label: 'Rose',
    icon: '🌸',
  },
  {
    id: 'amber',
    label: 'Amber',
    icon: '🌅',
  },

  // ── Dark themes ───────────────────────────────
  {
    id: 'dark-purple',
    label: 'Dark Purple',
    icon: '🔮',
  },
  {
    id: 'dark-ocean',
    label: 'Dark Ocean',
    icon: '🌌',
  },
  {
    id: 'noir',
    label: 'Noir',
    icon: '🖤',
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    icon: '🌑',
  },
];

const STORAGE_KEY = 'gvoice-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _theme = signal<ThemeId>(this.init());
  readonly theme = this._theme.asReadonly();

  setTheme(id: ThemeId): void {
    this._theme.set(id);
    this.doc.documentElement.setAttribute('data-theme', id);
    // localStorage is browser-only; guard so SSR/prerender never throws.
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, id);
    }
  }

  init(): ThemeId {
    const valid = THEMES.map(t => t.id);
    // On the server there is no localStorage — fall back to the default theme.
    const saved = this.isBrowser
      ? (localStorage.getItem(STORAGE_KEY) as ThemeId | null)
      : null;
    const id: ThemeId =
      saved && valid.includes(saved as ThemeId) ? (saved as ThemeId) : 'purple';
    // Setting the attribute is safe on the server (DOCUMENT is provided by SSR).
    this.doc.documentElement.setAttribute('data-theme', id);
    return id;
  }
}