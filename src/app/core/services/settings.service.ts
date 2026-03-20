import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  
  private readonly PTT_KEY_STORAGE = 'gvoice_ptt_key';
  private readonly AUDIO_ENHANCEMENTS_STORAGE = 'gvoice_audio_enhancements';
  private readonly NOISE_GATE_STORAGE = 'gvoice_noise_gate_threshold';

  private readonly DEFAULT_PTT_KEY = 'Space';
  private readonly DEFAULT_AUDIO_ENHANCEMENTS = true;
  private readonly DEFAULT_NOISE_GATE = 0.02;

  pttKey = signal<string>(this.DEFAULT_PTT_KEY);
  enableAudioEnhancements = signal<boolean>(this.DEFAULT_AUDIO_ENHANCEMENTS);
  noiseGateThreshold = signal<number>(this.DEFAULT_NOISE_GATE);

  constructor() {
    if (this.isBrowser) {
      const savedKey = localStorage.getItem(this.PTT_KEY_STORAGE);
      if (savedKey) {
        this.pttKey.set(savedKey);
      }

      const savedEnhancements = localStorage.getItem(this.AUDIO_ENHANCEMENTS_STORAGE);
      if (savedEnhancements !== null) {
        this.enableAudioEnhancements.set(savedEnhancements === 'true');
      }

      const savedNoiseGate = localStorage.getItem(this.NOISE_GATE_STORAGE);
      if (savedNoiseGate !== null) {
        this.noiseGateThreshold.set(parseFloat(savedNoiseGate));
      }
    }
  }

  savePttKey(key: string) {
    this.pttKey.set(key);
    if (this.isBrowser) {
      localStorage.setItem(this.PTT_KEY_STORAGE, key);
    }
  }

  updateAudioSettings(enableEnhancements: boolean, noiseGateThreshold: number) {
    this.enableAudioEnhancements.set(enableEnhancements);
    this.noiseGateThreshold.set(noiseGateThreshold);
    
    if (this.isBrowser) {
      localStorage.setItem(this.AUDIO_ENHANCEMENTS_STORAGE, String(enableEnhancements));
      localStorage.setItem(this.NOISE_GATE_STORAGE, String(noiseGateThreshold));
    }
  }

  resetToDefault() {
    this.savePttKey(this.DEFAULT_PTT_KEY);
    this.updateAudioSettings(this.DEFAULT_AUDIO_ENHANCEMENTS, this.DEFAULT_NOISE_GATE);
  }
}
