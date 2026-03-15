import { Component, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { SettingsService } from './core/services/settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, JoinRoomComponent, ParticipantListComponent, VoiceControlsComponent, ChatComponent, SettingsComponent],
  template: `
    <main (keydown)="onKeyDown($event)" (keyup)="onKeyUp($event)" class="app-container">
      <app-join-room *ngIf="connectionStatus() === 'Disconnected'"></app-join-room>
      
      <div *ngIf="connectionStatus() === 'Connecting'" class="status-container">
        <div class="loader"></div>
        <p>Connecting to room...</p>
      </div>

      <div *ngIf="connectionStatus() === 'Connected'" class="room-container">
        <header class="room-header">
          <div class="brand">
            <span class="logo">V</span>
            <h1>VoiceRoom</h1>
          </div>
          <div class="header-actions">
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
          <button (click)="rejoin()">Rejoin Session</button>
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
    }
    .app-container {
      height: 100%;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1f2937;
      background: #f9fafb;
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
      border-bottom: 1px solid #e5e7eb;
      z-index: 10;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .logo {
      background: #000;
      color: #fff;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-weight: 900;
      font-size: 1.2rem;
    }
    .brand h1 { margin: 0; font-size: 1.125rem; font-weight: 700; letter-spacing: -0.025em; }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .user-info { font-size: 0.875rem; color: #6b7280; }
    .settings-btn {
      background: none;
      border: 1px solid #e5e7eb;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1.125rem;
      line-height: 1;
      transition: all 0.2s;
    }
    .settings-btn:hover { background: #f9fafb; border-color: #d1d5db; }
    
    .main-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .sidebar {
      width: 320px;
      background: #fff;
      border-right: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      box-shadow: 2px 0 8px rgba(0,0,0,0.02);
    }

    .sidebar-section {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem;
    }

    .sidebar-footer {
      padding: 1.25rem;
      background: #fdfdfd;
      border-top: 1px solid #f3f4f6;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      background: #f9fafb;
    }

    .connection-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #059669;
      align-self: center;
      padding: 0.25rem 0.75rem;
      background: #ecfdf5;
      border-radius: 9999px;
    }
    .dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      animation: blink 2s infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .error-icon { font-size: 3rem; }
    
    button {
      padding: 0.625rem 1.25rem;
      background-color: #000;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover { background: #1f2937; }

    .loader {
      width: 24px;
      height: 24px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #000;
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
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class App {
  displayNameService = inject(DisplayNameService);
  signalrService = inject(SignalRService);
  audioAnalysisService = inject(AudioAnalysisService);
  webrtcService = inject(WebRtcService);
  chimesService = inject(ChimesService);
  settingsService = inject(SettingsService);
  
  displayName = this.displayNameService.displayName;
  connectionStatus = this.signalrService.connectionStatus;
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
    window.location.reload();
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
