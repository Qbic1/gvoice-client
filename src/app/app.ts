import { Component, inject, HostListener, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { JoinRoomComponent } from './features/room/join-room.component';
import { SettingsComponent } from './features/settings/settings.component';
import { DesktopLayoutComponent } from './features/layout/desktop-layout.component';
import { MobileLayoutComponent } from './features/layout/mobile-layout.component';
import { SignalRService } from './core/services/signalr.service';
import { WebRtcService } from './core/services/webrtc.service';
import { ChimesService } from './core/services/chimes.service';
import { SettingsService } from './core/services/settings.service';
import { LayoutService } from './core/services/layout.service';
import { ThemeService } from './core/services/theme.service'; // 👈 add
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root-inner',
  standalone: true,
  imports: [CommonModule, JoinRoomComponent, SettingsComponent, DesktopLayoutComponent, MobileLayoutComponent],
  template: `
    <main class="app-container">
      <!-- Stays mounted through 'Connecting': this component owns the
           subscriptions to invalidPassword$ / roomNotFound$ / roomFull$, and the
           server only answers after the connection is up. Unmount it here and a
           rejected join is never reported — the user waits forever. Its own
           button covers the pending state, so there is no separate loader. -->
      <app-join-room *ngIf="isJoining()"></app-join-room>

      <!-- The room stays mounted while reconnecting: tearing it down would drop
           the in-memory chat, the active mobile tab, and show the password form. -->
      <div *ngIf="isInRoom()" class="room-container">
        <app-desktop-layout 
          *ngIf="!isMobile()" 
          (onRejoin)="rejoin()" 
          (onShowSettings)="showSettings.set(true)">
        </app-desktop-layout>

        <app-mobile-layout 
          *ngIf="isMobile()" 
          (onRejoin)="rejoin()">
        </app-mobile-layout>
      </div>

      <!-- Reconnect banner — non-blocking, the room underneath stays usable -->
      <div *ngIf="connectionStatus() === 'Reconnecting'" class="reconnect-banner" role="status">
        <span class="reconnect-dot"></span>
        <span class="reconnect-text">Connection lost — reconnecting. Voice is muted until this clears.</span>
        <button class="reconnect-cancel" (click)="rejoin()" aria-label="Stop reconnecting and go back to the lobby">
          Leave
        </button>
      </div>

      <!-- Disconnect Overlay -->
      <div *ngIf="connectionStatus() === 'Error'" class="disconnect-overlay">
        <div class="disconnect-card">
          <div class="error-icon">⚠️</div>
          <h3>Disconnected</h3>
          <p>{{ disconnectReason() ?? 'The session has ended because the connection to the server was lost.' }}</p>
          <button (click)="rejoin()" class="primary-btn">Back to Lobby</button>
        </div>
      </div>

      <!-- Settings Modal (Desktop only, mobile has it in tabs) -->
      <app-settings *ngIf="showSettings() && !isMobile()" (onClose)="showSettings.set(false)"></app-settings>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      height: 100dvh;
      overflow: hidden;
      background: var(--bg-base);
    }
    .app-container {
      height: 100%;
      font-family: var(--font-family);
      color: var(--text-primary);
    }
    .room-container {
      height: 100%;
    }
    /* ── Reconnect banner ── */
    .reconnect-banner {
      position: fixed;
      top: calc(0.75rem + env(safe-area-inset-top));
      left: 50%;
      transform: translateX(-50%);
      z-index: 9998;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      max-width: calc(100vw - 2rem);
      padding: 0.5rem 0.875rem;
      background: var(--bg-surface);
      border: 1px solid color-mix(in srgb, var(--error-500) 35%, var(--border));
      border-radius: 9999px;
      box-shadow: var(--shadow-md);
      color: var(--text-primary);
      font-size: 0.75rem;
      font-weight: 600;
      /* The strip itself never swallows a click meant for the room; only the
         button below opts back in. */
      pointer-events: none;
    }
    .reconnect-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .reconnect-cancel {
      pointer-events: auto;
      flex-shrink: 0;
      margin-left: 0.25rem;
      padding: 0.25rem 0.625rem;
      background: var(--bg-muted);
      color: var(--text-primary);
      border: 1px solid var(--border);
      border-radius: 9999px;
      font-family: var(--font-family);
      font-size: 0.7rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .reconnect-cancel:hover {
      background: var(--accent-subtle);
      border-color: var(--accent);
      color: var(--accent);
    }
    .reconnect-dot {
      width: 8px;
      height: 8px;
      min-width: 8px;
      border-radius: 50%;
      background: var(--error-500);
      animation: blink 1.2s infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.3; }
    }
    @media (prefers-reduced-motion: reduce) {
      .reconnect-dot { animation: none; }
    }

    .disconnect-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .disconnect-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      padding: 2.5rem;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 400px;
      color: var(--text-primary);
    }
    .disconnect-card h3 {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 800;
      letter-spacing: -0.025em;
    }
    .disconnect-card p {
      margin: 0 0 1.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .primary-btn {
      padding: 0.75rem 1.5rem;
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .primary-btn:hover {
      background: var(--accent-hover);
      transform: translateY(-1px);
    }
  `]
})
export class App implements OnInit, OnDestroy {
  private router = inject(Router);
  private signalrService = inject(SignalRService);
  private webrtcService = inject(WebRtcService);
  private chimesService = inject(ChimesService);
  private settingsService = inject(SettingsService);
  private layoutService = inject(LayoutService);
  private themeService = inject(ThemeService); // 👈 eagerly instantiates the service so the
  //    data-theme attribute is set before first paint

  private subscriptions = new Subscription();

  connectionStatus = this.signalrService.connectionStatus;
  disconnectReason = this.signalrService.disconnectReason;
  showSettings = signal(false);
  isMobile = this.layoutService.isMobile;

  // Keep the room mounted through a transient reconnect.
  isInRoom = computed(() =>
    this.connectionStatus() === 'Connected' || this.connectionStatus() === 'Reconnecting'
  );

  isJoining = computed(() =>
    this.connectionStatus() === 'Disconnected' || this.connectionStatus() === 'Connecting'
  );

  ngOnInit() {
    this.subscriptions.add(this.signalrService.peerJoined$.subscribe(() => {
      this.chimesService.playJoinChime();
    }));

    this.subscriptions.add(this.signalrService.peerLeft$.subscribe(() => {
      this.chimesService.playLeaveChime();
    }));
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    if (document.hidden) {
      document.body.classList.add('app-background');
    } else {
      document.body.classList.remove('app-background');
    }
  }

  rejoin() {
    this.webrtcService.cleanup();
    this.signalrService.disconnect();
    this.router.navigate(['/']);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.shouldSuppress(event)) return;
    if (event.code === this.settingsService.pttKey()) {
      if (this.webrtcService.isPttMode()) event.preventDefault();
      this.webrtcService.setPttActive(true);
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    // NOTE: releasing PTT must NOT be gated by shouldSuppress. If the user pressed
    // the key, then focused an input (or the settings modal opened) before letting
    // go, a suppressed keyup would leave the mic open. Always release on the PTT key.
    if (event.code === this.settingsService.pttKey()) {
      if (this.webrtcService.isPttMode()) event.preventDefault();
      this.webrtcService.setPttActive(false);
    }
  }

  // Safety net: if the window loses focus (Alt-Tab, click into another app/window,
  // common inside the WebView2 shell) the keyup for a held PTT key is delivered to
  // the other window and never reaches us — the mic would stay open and keep
  // transmitting. Force-release PTT whenever we lose focus or the tab is hidden.
  @HostListener('window:blur')
  onWindowBlur() {
    this.webrtcService.setPttActive(false);
  }

  private shouldSuppress(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    return (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      this.showSettings()
    );
  }
}