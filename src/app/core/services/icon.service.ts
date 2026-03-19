import { Injectable, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONS } from '../../shared/icons';

@Injectable({
  providedIn: 'root'
})
export class IconService {
  private sanitizer = inject(DomSanitizer);
  
  private sanitizedIcons: Record<string, SafeHtml> = {};

  constructor() {
    // Pre-sanitize all icons
    Object.entries(ICONS).forEach(([key, value]) => {
      this.sanitizedIcons[key] = this.sanitizer.bypassSecurityTrustHtml(value);
    });
  }

  getIcon(name: keyof typeof ICONS): SafeHtml {
    return this.sanitizedIcons[name];
  }

  get MIC(): SafeHtml { return this.sanitizedIcons['MIC']; }
  get MIC_OFF(): SafeHtml { return this.sanitizedIcons['MIC_OFF']; }
  get DEAFEN(): SafeHtml { return this.sanitizedIcons['DEAFEN']; }
  get HEADPHONES(): SafeHtml { return this.sanitizedIcons['HEADPHONES']; }
  get BLOCK(): SafeHtml { return this.sanitizedIcons['BLOCK']; }
  get CHAT(): SafeHtml { return this.sanitizedIcons['CHAT']; }
  get ROOM(): SafeHtml { return this.sanitizedIcons['ROOM']; }
  get SETTINGS(): SafeHtml { return this.sanitizedIcons['SETTINGS']; }
  get HOME(): SafeHtml { return this.sanitizedIcons['HOME']; }
}
