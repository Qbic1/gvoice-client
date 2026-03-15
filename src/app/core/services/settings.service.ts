import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  
  private readonly PTT_KEY_STORAGE = 'gvoice_ptt_key';
  private readonly DEFAULT_PTT_KEY = 'Space';

  pttKey = signal<string>(this.DEFAULT_PTT_KEY);

  constructor() {
    if (this.isBrowser) {
      const savedKey = localStorage.getItem(this.PTT_KEY_STORAGE);
      if (savedKey) {
        this.pttKey.set(savedKey);
      }
    }
  }

  savePttKey(key: string) {
    this.pttKey.set(key);
    if (this.isBrowser) {
      localStorage.setItem(this.PTT_KEY_STORAGE, key);
    }
  }

  resetToDefault() {
    this.savePttKey(this.DEFAULT_PTT_KEY);
  }
}
