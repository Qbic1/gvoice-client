import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { WebRtcService } from '../../core/services/webrtc.service';
import { ParticipantService } from '../../core/services/participant.service';
import { ICONS } from '../../shared/icons';

@Component({
  selector: 'app-voice-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="controls-container">
      <div class="button-group">
        <button 
          (click)="toggleMute()" 
          [class.active]="!isMuted() && !isListenOnly()"
          [class.muted]="isMuted()" 
          [disabled]="isListenOnly() || isPttMode()"
          class="control-btn"
          [title]="isListenOnly() ? 'Microphone unavailable' : (isPttMode() ? 'PTT Active (Hold Space)' : (isMuted() ? 'Unmute' : 'Mute'))"
        >
          <span class="icon" [innerHTML]="getMicIcon()"></span>
        </button>

        <button 
          (click)="togglePttMode()" 
          [class.ptt-active]="isPttMode()"
          [disabled]="isListenOnly()"
          class="control-btn ptt-toggle"
          [title]="isPttMode() ? 'Disable PTT' : 'Enable PTT'"
        >
          <span class="icon ptt-text">PTT</span>
        </button>

        <button 
          (click)="toggleDeafen()" 
          [class.active]="isDeafened()"
          [class.muted]="isDeafened()"
          class="control-btn"
          [title]="isDeafened() ? 'Undeafen' : 'Deafen'"
        >
          <span class="icon" [innerHTML]="getDeafenIcon()"></span>
        </button>
      </div>
      
      <div class="mode-label" [class.ptt]="isPttMode()">
        {{ isPttMode() ? 'PTT Mode' : 'Open Mic' }}
      </div>
    </div>
  `,
  styles: [`
    .controls-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
    }
    .button-group {
      display: flex;
      background: #f3f4f6;
      padding: 4px;
      border-radius: 12px;
      gap: 4px;
    }
    .control-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border: none;
      border-radius: 8px;
      background: #fff;
      cursor: pointer;
      transition: all 0.2s;
      color: #374151;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .control-btn:hover:not(:disabled) {
      background: #f9fafb;
      transform: translateY(-1px);
    }
    .control-btn.active {
      color: #10b981;
    }
    .control-btn.muted {
      color: #ef4444;
      background: #fee2e2;
    }
    .ptt-toggle.ptt-active {
      background: #111827;
      color: #fff;
    }
    .control-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #e5e7eb;
    }
    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ptt-text {
      font-size: 0.75rem;
      font-weight: 800;
    }
    .mode-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
    }
    .mode-label.ptt {
      color: #111827;
    }
  `]
})
export class VoiceControlsComponent {
  private webrtcService = inject(WebRtcService);
  private participantService = inject(ParticipantService);
  private sanitizer = inject(DomSanitizer);
  
  isMuted = this.webrtcService.isMuted;
  isPttMode = this.webrtcService.isPttMode;
  isDeafened = this.webrtcService.isDeafened;
  isListenOnly = computed(() => this.participantService.localParticipant()?.isListenOnly ?? false);

  toggleMute() {
    this.webrtcService.toggleMute();
  }

  togglePttMode() {
    this.webrtcService.togglePttMode();
  }

  toggleDeafen() {
    this.webrtcService.toggleDeafen();
  }

  getMicIcon() {
    if (this.isListenOnly()) return this.sanitizer.bypassSecurityTrustHtml(ICONS.BLOCK);
    return this.sanitizer.bypassSecurityTrustHtml(this.isMuted() ? ICONS.MIC_OFF : ICONS.MIC);
  }

  getDeafenIcon() {
    return this.sanitizer.bypassSecurityTrustHtml(this.isDeafened() ? ICONS.DEAFEN : ICONS.HEADPHONES);
  }
}
