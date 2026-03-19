import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipantListComponent } from '../room/participant-list.component';
import { VoiceControlsComponent } from '../controls/voice-controls.component';
import { ChatComponent } from '../chat/chat.component';
import { IconService } from '../../core/services/icon.service';
import { ParticipantService } from '../../core/services/participant.service';
import { DisplayNameService } from '../../core/services/display-name.service';

@Component({
  selector: 'app-desktop-layout',
  standalone: true,
  imports: [CommonModule, ParticipantListComponent, VoiceControlsComponent, ChatComponent],
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
          <button class="secondary-btn home-btn" (click)="onRejoin.emit()" title="Back to Lobby">
             <span class="icon" [innerHTML]="icons.HOME"></span>
          </button>
          <button class="settings-btn" (click)="onShowSettings.emit()" title="Settings">
            <span class="icon" [innerHTML]="icons.SETTINGS"></span>
          </button>
        </div>
      </header>
      
      <div class="main-layout">
        <aside class="sidebar">
          <div class="sidebar-section">
            <app-participant-list></app-participant-list>
          </div>
          
          <div class="sidebar-footer">
            <app-voice-controls></app-voice-controls>
            <div class="connection-pill">
              <span class="dot"></span> Connected
            </div>
          </div>
        </aside>
        
        <section class="content-area">
          <app-chat></app-chat>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .room-container {
      display: flex;
      flex-direction: column;
      height: 100dvh;
    }
    .room-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.5rem;
      background: #fff;
      border-bottom: 1px solid var(--gray-200);
      z-index: 10;
      box-shadow: var(--shadow-sm);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .logo {
      background: var(--gray-900);
      color: #fff;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-weight: 700;
      font-size: 1.2rem;
    }
    .brand h1 { 
      margin: 0; 
      font-size: 1.125rem; 
      font-weight: 600; 
      color: var(--gray-900);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .user-info { font-size: 0.875rem; color: var(--gray-600); }
    
    .main-layout {
      flex: 1;
      display: flex;
      overflow: hidden;
    }
    
    .sidebar {
      width: 320px;
      background: #fff;
      border-right: 1px solid var(--gray-200);
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
      border-top: 1px solid var(--gray-200);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--gray-50);
    }

    .connection-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--success-500);
      align-self: center;
      padding: 0.25rem 0.75rem;
      background: #ecfdf5;
      border-radius: 9999px;
    }
    .dot {
      width: 6px;
      height: 6px;
      background: var(--success-500);
      border-radius: 50%;
      animation: blink 2s infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    button {
      padding: 0.625rem 1.25rem;
      background-color: var(--primary-600);
      color: #fff;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover { background: var(--primary-700); }

    .secondary-btn {
      background: #fff;
      color: var(--gray-800);
      border: 1px solid var(--gray-300);
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 600;
    }
    .secondary-btn:hover {
      background: var(--gray-100);
      border-color: var(--gray-400);
    }
    
    .home-btn, .settings-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
    }
    .icon { display: flex; align-items: center; justify-content: center; }
  `]
})
export class DesktopLayoutComponent {
  icons = inject(IconService);
  participantService = inject(ParticipantService);
  displayNameService = inject(DisplayNameService);

  roomName = this.participantService.roomName;
  displayName = this.displayNameService.displayName;

  @Output() onRejoin = new EventEmitter<void>();
  @Output() onShowSettings = new EventEmitter<void>();
}
