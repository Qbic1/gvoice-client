import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AudioProcessorService } from './audio-processor.service';

@Injectable({
  providedIn: 'root'
})
export class ChimesService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private audioProcessorService = inject(AudioProcessorService);

  private get audioContext(): AudioContext | null {
    return this.audioProcessorService.audioContext;
  }

  constructor() {}

  playJoinChime() {
    this.playTone([440, 554.37, 659.25], 0.1); // A4, C#5, E5 (A major)
  }

  playLeaveChime() {
    this.playTone([659.25, 554.37, 440], 0.15); // E5, C#5, A4
  }

  playScreenShareStart() {
    // Softer, lower-pitched ascending dyad
    this.playTone([392.00, 523.25], 0.1, 0.04); // G4, C5
  }

  playScreenShareStop() {
    // Softer, lower-pitched descending dyad
    this.playTone([523.25, 392.00], 0.12, 0.04); // C5, G4
  }

  private playTone(frequencies: number[], duration: number, volume: number = 0.1) {
    if (!this.isBrowser) return;
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const now = this.audioContext.currentTime;
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.1);

      gainNode.gain.setValueAtTime(0, now + index * 0.1);
      gainNode.gain.linearRampToValueAtTime(volume, now + index * 0.1 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + duration + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.start(now + index * 0.1);
      oscillator.stop(now + index * 0.1 + duration + 0.2);
    });
  }
}
