import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipantListComponent } from '../room/participant-list.component';
import { VoiceControlsComponent } from '../controls/voice-controls.component';
import { ChatComponent } from '../chat/chat.component';
import { IconService } from '../../core/services/icon.service';
import { ParticipantService } from '../../core/services/participant.service';

@Component({
  selector: 'app-mobile-layout',
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
           <button class="secondary-btn home-btn" (click)="onRejoin.emit()" title="Back to Lobby">
             <span class="icon" [innerHTML]="icons.HOME"></span>
          </button>
        </div>
      </header>

      <main class="content-area">
        <div class="mobile-top-section">
          <app-participant-list></app-participant-list>
        </div>
        
        <div class="mobile-chat-section">
          <app-chat></app-chat>
        </div>
      </main>

      <footer class="mobile-footer">
        <div class="voice-controls-wrapper">
          <app-voice-controls></app-voice-controls>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .room-container {
      display: flex;
      flex-direction: column;
      height: 100dvh;
      background: var(--gray-50);
    }
    .room-header {
      flex: 0 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #fff;
      border-bottom: 1px solid var(--gray-200);
      z-index: 10;
    }
    .brand { display: flex; align-items: center; gap: 0.625rem; }
    .logo {
      background: var(--gray-900);
      color: #fff;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      font-weight: 700;
      font-size: 1rem;
    }
    .room-title { margin: 0; font-size: 1rem; font-weight: 600; }
    
    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .mobile-top-section {
      flex: 0 0 auto;
      max-height: 40%;
      overflow-y: auto;
      padding: 0.75rem;
      border-bottom: 1px solid var(--gray-200);
      background: #fff;
    }

    .mobile-chat-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .mobile-footer {
      flex: 0 0 auto;
      background: #fff;
      border-top: 1px solid var(--gray-200);
      padding-bottom: env(safe-area-inset-bottom);
    }

    .voice-controls-wrapper {
      padding: 0.75rem 1rem;
    }

    .home-btn {
      width: 36px;
      height: 36px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      border: 1px solid var(--gray-200);
      border-radius: 0.5rem;
      color: var(--gray-600);
    }
  `]
})
export class MobileLayoutComponent {
  icons = inject(IconService);
  participantService = inject(ParticipantService);
  
  roomName = this.participantService.roomName;

  @Output() onRejoin = new EventEmitter<void>();
}
