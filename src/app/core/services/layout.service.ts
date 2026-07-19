import { Injectable, signal, effect, inject, OnDestroy } from '@angular/core';
import { WebRtcService } from './webrtc.service';

@Injectable({
  providedIn: 'root'
})
export class LayoutService implements OnDestroy {
  private webrtcService = inject(WebRtcService);

  isMobile = signal(false);

  private readonly onResize = () => this.checkWidth();

  constructor() {
    this.checkWidth();

    // Reactive layout update when stream state changes
    effect(() => {
      this.webrtcService.currentStreamToWatch();
      this.checkWidth();
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onResize);
    }
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResize);
    }
  }

  private checkWidth() {
    if (typeof window !== 'undefined') {
      const isSmallScreen = window.innerWidth < 768;
      const isWatching = this.webrtcService.currentStreamToWatch() !== null;

      // If screen is small, always mobile.
      // If screen is large, only mobile if we are ALREADY in mobile mode and watching a stream
      // (this preserves mobile layout on rotation to landscape).
      // Otherwise, use desktop layout.
      if (isSmallScreen) {
        this.isMobile.set(true);
      } else if (!isWatching) {
        this.isMobile.set(false);
      }
    }
  }
}
