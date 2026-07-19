import { describe, it, expect, beforeEach } from 'vitest';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

const STORAGE_KEY = 'gvoice-theme';

describe('ThemeService (browser)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  function create(): ThemeService {
    TestBed.configureTestingModule({ providers: [ThemeService] });
    return TestBed.inject(ThemeService);
  }

  it('defaults to purple when nothing is stored', () => {
    const svc = create();
    expect(svc.theme()).toBe('purple');
    expect(document.documentElement.getAttribute('data-theme')).toBe('purple');
  });

  it('restores a valid stored theme', () => {
    localStorage.setItem(STORAGE_KEY, 'ocean');
    const svc = create();
    expect(svc.theme()).toBe('ocean');
  });

  it('ignores an invalid stored theme and falls back to purple', () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-theme');
    const svc = create();
    expect(svc.theme()).toBe('purple');
  });

  it('setTheme updates the signal, the attribute and localStorage', () => {
    const svc = create();
    svc.setTheme('noir');
    expect(svc.theme()).toBe('noir');
    expect(document.documentElement.getAttribute('data-theme')).toBe('noir');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('noir');
  });
});

describe('ThemeService (server / SSR)', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('does not touch localStorage on the server and still defaults to purple', () => {
    // Force the "server" platform. If the service read localStorage without an
    // isBrowser guard this construction would throw ReferenceError during SSR.
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    const svc = TestBed.inject(ThemeService);
    expect(svc.theme()).toBe('purple');
    // setTheme must be a no-op against storage on the server (no throw).
    expect(() => svc.setTheme('amber')).not.toThrow();
    expect(svc.theme()).toBe('amber');
  });
});
