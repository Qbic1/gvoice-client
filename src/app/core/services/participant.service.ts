import { Injectable, signal, inject, computed } from '@angular/core';
import { SignalRService } from './signalr.service';
import { Participant } from '../models/participant.model';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {
  private signalrService = inject(SignalRService);
  
  // Use a signal for the list of participants to make it reactive
  participants = signal<Participant[]>([]);

  localParticipant = computed(() => {
    const id = this.signalrService.connectionId();
    return this.participants().find(p => p.connectionId === id);
  });

  constructor() {
    this.signalrService.roomJoined$.subscribe((existingParticipants) => {
      this.participants.set(existingParticipants);
    });

    this.signalrService.peerJoined$.subscribe((participant) => {
      this.participants.update(list => [...list, participant]);
    });

    this.signalrService.peerLeft$.subscribe((peer) => {
      this.participants.update(list => list.filter(p => p.connectionId !== peer.connectionId));
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
}
