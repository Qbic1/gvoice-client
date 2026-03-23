import { Component, inject, HostListener, signal, OnInit, OnDestroy, effect } from '@angular/core';
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
    <main (keydown)="onKeyDown($event)" (keyup)="onKeyUp($event)" class="app-container">
      <app-join-room *ngIf="connectionStatus() !== 'Connected'"></app-join-room>

      <div *ngIf="connectionStatus() === 'Connecting'" class="status-container">
        <div class="loader"></div>
        <p>Connecting to room...</p>
      </div>

      <div *ngIf="connectionStatus() === 'Connected'" class="room-container">
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

      <!-- Disconnect Overlay -->
      <div *ngIf="connectionStatus() === 'Error'" class="disconnect-overlay">
        <div class="disconnect-card">
          <div class="error-icon">⚠️</div>
          <h3>Server Disconnected</h3>
          <p>The session has ended because the connection to the server was lost.</p>
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
    .status-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100dvh;
      gap: 1rem;
      color: var(--text-secondary);
    }
    .room-container {
      height: 100%;
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
    .loader {
      width: 32px;
      height: 32px;
      border: 4px solid var(--border);
      border-top: 4px solid var(--accent);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0%   { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
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
  showSettings = signal(false);
  isMobile = this.layoutService.isMobile;

  ngOnInit() {
    this.subscriptions.add(this.signalrService.peerJoined$.subscribe(() => {
      this.chimesService.playJoinChime();
    }));

    this.subscriptions.add(this.signalrService.peerLeft$.subscribe(() => {
      this.chimesService.playLeaveChime();
    }));

    document.addEventListener('visibilitychange', () => {
      const hidden = document.hidden;

      if (hidden) {
        document.body.classList.add('app-background');
      } else {
        document.body.classList.remove('app-background');
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  rejoin() {
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
    if (this.shouldSuppress(event)) return;
    if (event.code === this.settingsService.pttKey()) {
      if (this.webrtcService.isPttMode()) event.preventDefault();
      this.webrtcService.setPttActive(false);
    }
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