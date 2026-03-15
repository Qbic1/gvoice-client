import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class DisplayNameService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private readonly STORAGE_KEY = 'gvoice_display_name';
  private readonly adjectives = ['Brave', 'Calm', 'Swift', 'Wise', 'Happy', 'Quiet', 'Bold', 'Kind', 'Fast', 'Clever'];
  private readonly nouns = ['Badger', 'Eagle', 'Wolf', 'Fox', 'Owl', 'Bear', 'Panda', 'Tiger', 'Lion', 'Hawk'];

  displayName = signal<string | null>(this.getStoredName());

  constructor() {}

  private getStoredName(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(this.STORAGE_KEY);
    }
    return null;
  }

  saveName(name: string) {
    const finalName = name.trim() || this.generateRandomName();
    if (this.isBrowser) {
      localStorage.setItem(this.STORAGE_KEY, finalName);
    }
    this.displayName.set(finalName);
  }

  private generateRandomName(): string {
    const adj = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
    const noun = this.nouns[Math.floor(Math.random() * this.nouns.length)];
    return `${adj} ${noun}`;
  }
}
