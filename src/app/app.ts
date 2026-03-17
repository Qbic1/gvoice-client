import { Component, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { JoinRoomComponent } from './features/room/join-room.component';
import { ParticipantListComponent } from './features/room/participant-list.component';
import { VoiceControlsComponent } from './features/controls/voice-controls.component';
import { ChatComponent } from './features/chat/chat.component';
import { SettingsComponent } from './features/settings/settings.component';
import { DisplayNameService } from './core/services/display-name.service';
import { SignalRService } from './core/services/signalr.service';
import { AudioAnalysisService } from './core/services/audio-analysis.service';
import { WebRtcService } from './core/services/webrtc.service';
import { ChimesService } from './core/services/chimes.service';
import { ParticipantService } from './core/services/participant.service';
import { SettingsService } from './core/services/settings.service';

@Component({
  selector: 'app-root-inner',
  standalone: true,
  imports: [CommonModule, JoinRoomComponent, ParticipantListComponent, VoiceControlsComponent, ChatComponent, SettingsComponent],
  template: `
    <main (keydown)="onKeyDown($event)" (keyup)="onKeyUp($event)" class="app-container">
      <app-join-room *ngIf="connectionStatus() !== 'Connected'"></app-join-room>
      
      <div *ngIf="connectionStatus() === 'Connecting'" class="status-container">
        <div class="loader"></div>
        <p>Connecting to room...</p>
      </div>

      <div *ngIf="connectionStatus() === 'Connected'" class="room-container">
        <header class="room-header">
          <div class="brand">
            <span class="logo">V</span>
            <h1>{{ roomName() }}</h1>
          </div>
          <div class="header-actions">
            <button class="secondary-btn" (click)="rejoin()">Lobby</button>
            <div class="user-info">
              Joined as: <strong>{{ displayName() }}</strong>
            </div>
            <button class="settings-btn" (click)="showSettings.set(true)" title="Settings">
              ⚙️
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

      <!-- Disconnect Overlay -->
      <div *ngIf="connectionStatus() === 'Error'" class="disconnect-overlay">
        <div class="disconnect-card">
          <div class="error-icon">⚠️</div>
          <h3>Server Disconnected</h3>
          <p>The session has ended because the connection to the server was lost.</p>
          <button (click)="rejoin()">Back to Lobby</button>
        </div>
      </div>

      <!-- Settings Modal -->
      <app-settings *ngIf="showSettings()" (onClose)="showSettings.set(false)"></app-settings>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
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
      height: 100vh;
      gap: 1rem;
    }
    .room-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
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
    .settings-btn {
      background: none;
      border: 1px solid var(--gray-300);
      padding: 0.375rem 0.625rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 1.125rem;
      line-height: 1;
      transition: all 0.2s;
      color: var(--gray-600);
    }
    .settings-btn:hover { background: var(--gray-100); border-color: var(--gray-400); }
    
    .main-layout {
      display: flex;
      flex: 1;
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

    .error-icon { font-size: 3rem; color: var(--error-500); }
    
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

    .loader {
      width: 24px;
      height: 24px;
      border: 3px solid var(--gray-200);
      border-top: 3px solid var(--primary-600);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .disconnect-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease-out;
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
      box-shadow: var(--shadow-lg);
    }
    .disconnect-card h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--gray-900);
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .disconnect-card p {
      color: var(--gray-600);
      margin-bottom: 2rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class App {
  private router = inject(Router);
  private displayNameService = inject(DisplayNameService);
  private signalrService = inject(SignalRService);
  private participantService = inject(ParticipantService);
  private audioAnalysisService = inject(AudioAnalysisService);
  private webrtcService = inject(WebRtcService);
  private chimesService = inject(ChimesService);
  private settingsService = inject(SettingsService);
  
  displayName = this.displayNameService.displayName;
  connectionStatus = this.signalrService.connectionStatus;
  roomName = this.participantService.roomName;
  showSettings = signal(false);

  constructor() {
    this.signalrService.peerJoined$.subscribe(() => {
      this.chimesService.playJoinChime();
    });

    this.signalrService.peerLeft$.subscribe(() => {
      this.chimesService.playLeaveChime();
    });
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
