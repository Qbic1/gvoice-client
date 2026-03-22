import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipantListComponent } from '../room/participant-list.component';
import { VoiceControlsComponent } from '../controls/voice-controls.component';
import { ChatComponent } from '../chat/chat.component';
import { SettingsComponent } from '../settings/settings.component';
import { IconService } from '../../core/services/icon.service';
import { ParticipantService } from '../../core/services/participant.service';
import { WebRtcService } from '../../core/services/webrtc.service';
import { ScreenShareOverlayComponent } from '../room/screen-share-overlay.component';

type MobileTab = 'room' | 'chat' | 'settings';

@Component({
  selector: 'app-mobile-layout',
  standalone: true,
  imports: [
    CommonModule, 
    ParticipantListComponent, 
    VoiceControlsComponent, 
    ChatComponent, 
    SettingsComponent,
    ScreenShareOverlayComponent
  ],
  template: `
    <div class="room-container">

      <!-- Header -->
      <header class="room-header">
        <div class="brand">
          <span class="logo">V</span>
          <h1 class="room-title">{{ roomName() }}</h1>
        </div>
        <div class="header-actions">
          <button class="icon-btn" (click)="onRejoin.emit()" title="Back to Lobby">
            <span class="icon" [innerHTML]="icons.HOME"></span>
          </button>
        </div>
      </header>

      <!-- Tab content -->
      <main class="content-area">

        <!-- Room tab: participants + voice controls -->
        <div class="tab-panel" [class.visible]="activeTab() === 'room'">
          <div class="participants-section">
            <app-participant-list (onWatchStream)="watchStream($event)"></app-participant-list>
          </div>
          <div class="voice-section">
            <app-voice-controls></app-voice-controls>
            <div class="connection-pill">
              <span class="dot"></span> Connected
            </div>
          </div>
        </div>

        <!-- Chat tab -->
        <div class="tab-panel chat-panel" [class.visible]="activeTab() === 'chat'">
          <app-chat></app-chat>
        </div>

        <!-- Settings tab -->
        <div class="tab-panel settings-panel" [class.visible]="activeTab() === 'settings'">
          <app-settings [isInline]="true" [hideControls]="true"></app-settings>
        </div>

      </main>

      <app-screen-share-overlay
        *ngIf="streamToWatch()"
        [stream]="streamToWatch()!"
        (closeOverlay)="closeStream()"
      ></app-screen-share-overlay>

      <!-- Bottom navigation -->
      <nav class="bottom-nav">
        <button
          class="nav-btn"
          [class.active]="activeTab() === 'room'"
          (click)="activeTab.set('room')"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>Room</span>
        </button>

        <button
          class="nav-btn"
          [class.active]="activeTab() === 'chat'"
          (click)="activeTab.set('chat')"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Chat</span>
        </button>

        <button
          class="nav-btn"
          [class.active]="activeTab() === 'settings'"
          (click)="activeTab.set('settings')"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>Settings</span>
        </button>
      </nav>

    </div>
  `,
  styles: [`
    .room-container {
      display: flex;
      flex-direction: column;
      height: 100dvh;
      background: var(--bg-base);
    }

    /* ── Header ── */
    .room-header {
      flex: 0 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      z-index: 10;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }
    .logo {
      background: var(--text-primary);
      color: var(--bg-surface);
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      font-weight: 700;
      font-size: 1rem;
    }
    .room-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .header-actions { display: flex; gap: 0.5rem; }
    .icon-btn {
      width: 36px;
      height: 36px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-base);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
    }
    .icon-btn:hover {
      background: var(--bg-muted);
      color: var(--text-primary);
      border-color: var(--accent);
    }
    .icon { display: flex; align-items: center; justify-content: center; }

    /* ── Content area ── */
    .content-area {
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    /* ── Tab panels ── */
    .tab-panel {
      position: absolute;
      inset: 0;
      display: none;
      flex-direction: column;
      overflow: hidden;
    }
    .tab-panel.visible {
      display: flex;
    }

    /* Room tab layout */
    .participants-section {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border);
    }
    .voice-section {
      flex: 0 0 auto;
      padding: 1rem;
      background: var(--bg-surface);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      border-top: 1px solid var(--border);
      padding-bottom: calc(1rem + env(safe-area-inset-bottom));
    }

    /* Chat tab */
    .chat-panel { background: var(--bg-base); }

    /* Settings tab */
    .settings-panel {
      overflow-y: auto;
      padding: 0;
      background: var(--bg-base);
    }

    /* ── Connection pill ── */
    .connection-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--success-500);
      align-self: center;
      padding: 0.25rem 0.75rem;
      background: color-mix(in srgb, var(--success-500) 12%, var(--bg-surface));
      border-radius: 9999px;
      border: 1px solid color-mix(in srgb, var(--success-500) 25%, transparent);
    }
    .dot {
      width: 8px;
      height: 8px;
      min-width: 8px;
      background: var(--success-500);
      border-radius: 50%;
      display: block;
      animation: blink 2s infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.3; }
    }

    /* ── Bottom nav ── */
    .bottom-nav {
      flex: 0 0 auto;
      display: flex;
      background: var(--bg-surface);
      border-top: 1px solid var(--border);
      padding-bottom: env(safe-area-inset-bottom);
    }
    .nav-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      padding: 0.625rem 0;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      transition: all 0.15s;
      font-family: var(--font-family);
      position: relative;
    }
    .nav-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: 25%;
      right: 25%;
      height: 2px;
      background: var(--accent);
      border-radius: 0 0 2px 2px;
      opacity: 0;
      transition: opacity 0.15s;
    }
    .nav-btn.active {
      color: var(--accent);
    }
    .nav-btn.active::before {
      opacity: 1;
    }
    .nav-btn:hover:not(.active) {
      color: var(--text-secondary);
      background: var(--bg-muted);
    }
  `]
})
export class MobileLayoutComponent {
  icons = inject(IconService);
  participantService = inject(ParticipantService);

  roomName = this.participantService.roomName;
  activeTab = signal<MobileTab>('room');

  webrtcService = inject(WebRtcService);
  streamToWatch = signal<MediaStream | null>(null);

  @Output() onRejoin = new EventEmitter<void>();

  watchStream(connectionId: string) {
    const stream = this.webrtcService.getStream(connectionId);
    if (stream) {
      this.streamToWatch.set(stream);
    }
  }

  closeStream() {
    this.streamToWatch.set(null);
  }
}