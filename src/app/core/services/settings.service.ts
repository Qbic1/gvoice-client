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
  private readonly INPUT_DEVICE_ID_STORAGE = 'gvoice_input_device_id';
  private readonly INPUT_DEVICE_LABEL_STORAGE = 'gvoice_input_device_label';
  private readonly OUTPUT_DEVICE_ID_STORAGE = 'gvoice_output_device_id';
  private readonly OUTPUT_DEVICE_LABEL_STORAGE = 'gvoice_output_device_label';

  private readonly DEFAULT_PTT_KEY = 'Space';
  private readonly DEFAULT_AUDIO_ENHANCEMENTS = true;
  private readonly DEFAULT_NOISE_GATE = 0.02;

  pttKey = signal<string>(this.DEFAULT_PTT_KEY);
  enableAudioEnhancements = signal<boolean>(this.DEFAULT_AUDIO_ENHANCEMENTS);
  noiseGateThreshold = signal<number>(this.DEFAULT_NOISE_GATE);

  inputDeviceId = signal<string>('default');
  inputDeviceLabel = signal<string>('Default');
  outputDeviceId = signal<string>('default');
  outputDeviceLabel = signal<string>('Default');

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

      const savedInputId = localStorage.getItem(this.INPUT_DEVICE_ID_STORAGE);
      if (savedInputId) this.inputDeviceId.set(savedInputId);

      const savedInputLabel = localStorage.getItem(this.INPUT_DEVICE_LABEL_STORAGE);
      if (savedInputLabel) this.inputDeviceLabel.set(savedInputLabel);

      const savedOutputId = localStorage.getItem(this.OUTPUT_DEVICE_ID_STORAGE);
      if (savedOutputId) this.outputDeviceId.set(savedOutputId);

      const savedOutputLabel = localStorage.getItem(this.OUTPUT_DEVICE_LABEL_STORAGE);
      if (savedOutputLabel) this.outputDeviceLabel.set(savedOutputLabel);
    }
  }

  savePttKey(key: string) {
    this.pttKey.set(key);
    if (this.isBrowser) {
      localStorage.setItem(this.PTT_KEY_STORAGE, key);
    }
  }

  saveInputDevice(id: string, label: string) {
    this.inputDeviceId.set(id);
    this.inputDeviceLabel.set(label);
    if (this.isBrowser) {
      localStorage.setItem(this.INPUT_DEVICE_ID_STORAGE, id);
      localStorage.setItem(this.INPUT_DEVICE_LABEL_STORAGE, label);
    }
  }

  saveOutputDevice(id: string, label: string) {
    this.outputDeviceId.set(id);
    this.outputDeviceLabel.set(label);
    if (this.isBrowser) {
      localStorage.setItem(this.OUTPUT_DEVICE_ID_STORAGE, id);
      localStorage.setItem(this.OUTPUT_DEVICE_LABEL_STORAGE, label);
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
    this.saveInputDevice('default', 'Default');
    this.saveOutputDevice('default', 'Default');
  }
}
