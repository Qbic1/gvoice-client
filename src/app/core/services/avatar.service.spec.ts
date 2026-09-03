import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { AvatarService } from './avatar.service';
import { DisplayNameService } from './display-name.service';
import { avatarForName } from '../../shared/avatars';

class MockDisplayNameService {
  displayName = signal<string | null>('Alice');
}

function configure(platform: 'browser' | 'server' = 'browser') {
  const displayName = new MockDisplayNameService();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      AvatarService,
      { provide: DisplayNameService, useValue: displayName },
      { provide: PLATFORM_ID, useValue: platform },
    ],
  });
  return { service: TestBed.inject(AvatarService), displayName };
}

describe('AvatarService', () => {
  beforeEach(() => localStorage.clear());

  it('falls back to the name-derived avatar before anything is chosen', () => {
    const { service } = configure();
    expect(service.hasChosen()).toBe(false);
    expect(service.avatarId()).toBe(avatarForName('Alice'));
  });

  it('follows the display name while nothing has been chosen', () => {
    // The default is derived, never persisted: storing it would leave a renamed
    // user wearing the face their old name happened to hash to.
    const { service, displayName } = configure();
    displayName.displayName.set('Bob');
    expect(service.avatarId()).toBe(avatarForName('Bob'));
  });

  it('persists an explicit choice and reads it back', () => {
    const { service } = configure();
    service.choose('drunk');

    expect(service.avatarId()).toBe('drunk');
    expect(service.hasChosen()).toBe(true);
    expect(localStorage.getItem('gvoice_avatar')).toBe('drunk');

    expect(configure().service.avatarId()).toBe('drunk');
  });

  it('ignores a stored value that is not a known avatar', () => {
    localStorage.setItem('gvoice_avatar', 'eleventh-avatar');
    const { service } = configure();
    expect(service.hasChosen()).toBe(false);
    expect(service.avatarId()).toBe(avatarForName('Alice'));
  });

  it('does not touch localStorage during SSR', () => {
    localStorage.setItem('gvoice_avatar', 'sly');
    const { service } = configure('server');

    expect(service.avatarId()).toBe(avatarForName('Alice'));

    service.choose('angry');
    expect(service.avatarId()).toBe('angry');
    expect(localStorage.getItem('gvoice_avatar')).toBe('sly');
  });
});
