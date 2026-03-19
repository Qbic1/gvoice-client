import { Component, inject, HostListener, signal, OnInit, OnDestroy } from '@angular/core';
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
      background: var(--gray-100);
    }
    .app-container {
      height: 100%;
      font-family: var(--font-family);
      color: var(--gray-800);
    }
    .status-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100dvh;
      gap: 1rem;
    }
    .room-container {
      height: 100%;
    }
    .disconnect-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .disconnect-card {
      background: #fff;
      padding: 2.5rem;
      border-radius: var(--border-radius);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 400px;
    }
    .error-icon { font-size: 3rem; margin-bottom: 1rem; }
    .primary-btn {
      padding: 0.75rem 1.5rem;
      background: var(--primary-600);
      color: #fff;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
    }
    .loader {
      width: 32px;
      height: 32px;
      border: 4px solid var(--gray-200);
      border-top: 4px solid var(--primary-600);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class App implements OnInit, OnDestroy {
  private router = inject(Router);
  private signalrService = inject(SignalRService);
  private webrtcService = inject(WebRtcService);
  private chimesService = inject(ChimesService);
  private settingsService = inject(SettingsService);
  
  private subscriptions = new Subscription();

  connectionStatus = this.signalrService.connectionStatus;
  showSettings = signal(false);
  isMobile = signal(false);

  constructor() {
    this.checkWidth();
  }

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

  @HostListener('window:resize')
  onResize() {
    this.checkWidth();
  }

  private checkWidth() {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }

  rejoin() {
    this.signalrService.disconnect();
    this.router.navigate(['/']);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.shouldSuppress(event)) return;
    if (event.code === this.settingsService.pttKey()) {
      if (this.webrtcService.isPttMode()) {
        event.preventDefault();
      }
      this.webrtcService.setPttActive(true);
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    if (this.shouldSuppress(event)) return;
    if (event.code === this.settingsService.pttKey()) {
      if (this.webrtcService.isPttMode()) {
        event.preventDefault();
      }
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
