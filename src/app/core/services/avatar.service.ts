import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AvatarId, avatarForName, isAvatarId } from '../../shared/avatars';
import { DisplayNameService } from './display-name.service';

/**
 * The local user's chosen avatar.
 *
 * Only the *explicit* choice is stored. When nothing has been chosen, `avatarId`
 * falls back to the name-derived default rather than persisting that default —
 * otherwise changing your display name would leave you wearing the face the old
 * name happened to hash to.
 */
@Injectable({ providedIn: 'root' })
export class AvatarService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private displayNameService = inject(DisplayNameService);

  private readonly STORAGE_KEY = 'gvoice_avatar';

  private chosen = signal<AvatarId | null>(this.readStored());

  /** True once the user has picked, rather than been assigned, an avatar. */
  hasChosen = computed(() => this.chosen() !== null);

  /** What to send to the server and draw for ourselves. Never null. */
  avatarId = computed<AvatarId>(
    () => this.chosen() ?? avatarForName(this.displayNameService.displayName() ?? '')
  );

  choose(id: AvatarId) {
    this.chosen.set(id);
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(this.STORAGE_KEY, id);
    } catch (err) {
      console.warn('Failed to persist avatar:', err);
    }
  }

  private readStored(): AvatarId | null {
    if (!this.isBrowser) return null;
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return isAvatarId(stored) ? stored : null;
    } catch {
      return null;
    }
  }
}
