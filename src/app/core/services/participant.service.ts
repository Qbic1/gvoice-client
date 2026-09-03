import { Injectable, signal, inject, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SignalRService } from './signalr.service';
import { Participant } from '../models/participant.model';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {
  private signalrService = inject(SignalRService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  
  private readonly VOLUME_PREFIX = 'gv_vol_';

  // Use a signal for the list of participants to make it reactive
  participants = signal<Participant[]>([]);
  roomName = signal<string>('');

  localParticipant = computed(() => {
    const id = this.signalrService.connectionId();
    return this.participants().find(p => p.connectionId === id);
  });

  isAnyScreenSharing = computed(() => this.participants().some(p => p.isSharingScreen));
  isLocalSharing = computed(() => this.localParticipant()?.isSharingScreen ?? false);

  constructor() {
    this.signalrService.roomJoined$.subscribe(payload => {
      const participantsWithVolume = payload.participants.map(p => ({
        ...p,
        volume: this.getStoredVolume(p.displayName)
      }));
      this.participants.set(participantsWithVolume);
      this.roomName.set(payload.name);
    });

    this.signalrService.peerJoined$.subscribe((participant) => {
      const pWithVol = {
        ...participant,
        volume: this.getStoredVolume(participant.displayName)
      };
      this.participants.update(list => [...list, pWithVol]);
    });


    this.signalrService.peerLeft$.subscribe((peer) => {
      this.participants.update(list => list.filter(p => p.connectionId !== peer.connectionId));
    });

    this.signalrService.avatarUpdated$.subscribe((update) => {
      this.participants.update(list =>
        list.map(p => p.connectionId === update.connectionId ? { ...p, avatar: update.avatar } : p)
      );
    });

    this.signalrService.peerStateUpdated$.subscribe((update) => {
      this.participants.update(list => {
        return list.map(p => {
          if (p.connectionId === update.connectionId) {
            const updatedParticipant = { ...p };
            if (update.stateType.toLowerCase() === 'muted') {
              updatedParticipant.isMuted = update.value;
            } else if (update.stateType.toLowerCase() === 'deafened') {
              updatedParticipant.isDeafened = update.value;
            } else if (update.stateType.toLowerCase() === 'sharingscreen') {
              updatedParticipant.isSharingScreen = update.value;
            }
            return updatedParticipant;
          }
          return p;
        });
      });
    });
  }

  updateSpeakingStatus(connectionId: string, isSpeaking: boolean) {
    this.participants.update(list => {
      return list.map(p => {
        if (p.connectionId === connectionId) {
          if (p.isSpeaking === isSpeaking) return p;
          return { ...p, isSpeaking };
        }
        return p;
      });
    });
  }

  updateParticipantVolume(connectionId: string, volume: number) {
    let displayName: string | null = null;

    this.participants.update(list =>
      list.map(p => {
        if (p.connectionId === connectionId) {
          displayName = p.displayName;
          return { ...p, volume };
        }
        return p;
      })
    );

    // Persist outside the signal updater — updaters must stay pure/side-effect-free.
    if (this.isBrowser && displayName !== null) {
      try {
        localStorage.setItem(`${this.VOLUME_PREFIX}${displayName}`, volume.toString());
      } catch (err) {
        console.warn('Failed to persist participant volume:', err);
      }
    }
  }

  private getStoredVolume(displayName: string): number {
    if (!this.isBrowser) return 100;
    const stored = localStorage.getItem(`${this.VOLUME_PREFIX}${displayName}`);
    if (!stored) return 100;
    const parsed = parseInt(stored, 10);
    return Number.isNaN(parsed) ? 100 : parsed;
  }
}
