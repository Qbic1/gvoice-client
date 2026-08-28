import { Component, inject, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipantListComponent } from '../room/participant-list.component';
import { VoiceControlsComponent } from '../controls/voice-controls.component';
import { ChatComponent } from '../chat/chat.component';
import { IconService } from '../../core/services/icon.service';
import { ParticipantService } from '../../core/services/participant.service';
import { DisplayNameService } from '../../core/services/display-name.service';
import { WebRtcService } from '../../core/services/webrtc.service';
import { ScreenShareOverlayComponent } from '../room/screen-share-overlay.component';
import { ConnectionPillComponent } from '../../shared/components/connection-pill.component';

@Component({
  selector: 'app-desktop-layout',
  standalone: true,
  imports: [
    CommonModule, 
    ParticipantListComponent, 
    VoiceControlsComponent, 
    ChatComponent,
    ScreenShareOverlayComponent,
    ConnectionPillComponent
  ],
  template: `
    <div class="room-container">
      <header class="room-header">
        <div class="brand">
          <span class="logo">V</span>
          <h1 class="room-title">{{ roomName() }}</h1>
        </div>
        <div class="header-actions">
          <div class="user-info">
            Joined as: <strong>{{ displayName() }}</strong>
          </div>

          <button 
            class="icon-btn" 
            [class.active]="isLocalSharing()" 
            [disabled]="isAnyScreenSharing() && !isLocalSharing()"
            (click)="toggleScreenShare()" 
            [attr.aria-label]="isLocalSharing() ? 'Stop sharing your screen' : 'Share your screen'"
            [title]="isLocalSharing() ? 'Stop Sharing' : 'Share Screen'">
            <span class="icon" [innerHTML]="icons.SCREEN_SHARE"></span>
          </button>

          <button type="button" class="icon-btn" (click)="onRejoin.emit()" aria-label="Back to lobby" title="Back to Lobby">
            <span class="icon" [innerHTML]="icons.HOME"></span>
          </button>
          <button type="button" class="icon-btn" (click)="onShowSettings.emit()" aria-label="Settings" title="Settings">
            <span class="icon" [innerHTML]="icons.SETTINGS"></span>
          </button>
        </div>
      </header>

      <div class="main-layout">
        <aside class="sidebar">
          <div class="sidebar-section">
            <app-participant-list (onWatchStream)="watchStream($event)" (onRejoin)="onRejoin.emit()"></app-participant-list>
          </div>
          <div class="sidebar-footer">
            <app-voice-controls></app-voice-controls>
            <app-connection-pill></app-connection-pill>
          </div>
        </aside>

        <section class="content-area">
          <app-chat></app-chat>
        </section>
      </div>

      <app-screen-share-overlay
        *ngIf="streamToWatch()"
        [stream]="streamToWatch()!"
        (closeOverlay)="closeStream()"
      ></app-screen-share-overlay>
    </div>
  `,
  styles: [`
    .room-container {
      display: flex;
      flex-direction: column;
      height: 100dvh;
    }

    /* ── Header ── */
    .room-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.5rem;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      z-index: 10;
      box-shadow: var(--shadow-sm);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .logo {
      background: var(--text-primary);
      color: var(--bg-surface);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-weight: 700;
      font-size: 1.2rem;
    }
    .room-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .user-info {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    .user-info strong {
      color: var(--text-primary);
    }

    /* ── Icon buttons ── */
    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      padding: 0;
      background: var(--bg-base);
      color: var(--text-secondary);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .icon-btn:hover {
      background: var(--bg-muted);
      color: var(--text-primary);
      border-color: var(--accent);
    }
    .icon-btn.active {
      background: var(--accent);
      color: var(--on-accent);
      border-color: var(--accent);
    }
    .icon-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      filter: grayscale(1);
    }
    .icon { display: flex; align-items: center; justify-content: center; }

    /* ── Layout ── */
    .main-layout {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .sidebar {
      width: 320px;
      background: var(--bg-surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
    }
    .sidebar-section {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }
    .sidebar-footer {
      padding: 1.25rem;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-base);
    }

    /* The connection readout lives in app-connection-pill; it owns its own
       styles so the two shells cannot drift apart. */
  `]
})
export class DesktopLayoutComponent {
  icons = inject(IconService);
  participantService = inject(ParticipantService);
  displayNameService = inject(DisplayNameService);
  webrtcService = inject(WebRtcService);

  roomName = this.participantService.roomName;
  displayName = this.displayNameService.displayName;
  isLocalSharing = this.webrtcService.isSharingScreen;
  isAnyScreenSharing = this.participantService.isAnyScreenSharing;

  streamToWatch = this.webrtcService.currentStreamToWatch;

  @Output() onRejoin = new EventEmitter<void>();
  @Output() onShowSettings = new EventEmitter<void>();

  toggleScreenShare() {
    if (this.isLocalSharing()) {
      this.webrtcService.stopScreenShare();
    } else {
      this.webrtcService.startScreenShare();
    }
  }

  watchStream(connectionId: string) {
    this.webrtcService.watchStream(connectionId);
  }

  closeStream() {
    this.webrtcService.closeStream();
  }
}