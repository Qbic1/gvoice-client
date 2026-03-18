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
          [disabled]="isListenOnly() || (isPttMode() && !isMobile())"
          class="control-btn"
          [title]="isListenOnly() ? 'Microphone unavailable' : (isPttMode() ? 'PTT Active' : (isMuted() ? 'Unmute' : 'Mute'))"
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

      <!-- Mobile Toggle PTT Button -->
      <div *ngIf="isMobile() && isPttMode()" class="mobile-ptt-container mt-6">
         <button 
           (click)="toggleMobilePtt()" 
           [class.transmitting]="isPttActive()"
           class="mobile-ptt-btn"
         >
           <div class="inner-circle">
             <span class="icon" [innerHTML]="getMicIconLarge()"></span>
             <span class="ptt-label">{{ isPttActive() ? 'LIVE' : 'TAP TO TALK' }}</span>
           </div>
         </button>
      </div>
      
      <div class="mode-label mt-2" [class.ptt]="isPttMode()">
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
    .ptt-toggle.ptt-active:hover {
      background: #374151;
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

    /* Mobile PTT Styles */
    .mobile-ptt-container {
      width: 100%;
      display: flex;
      justify-content: center;
    }
    .mobile-ptt-btn {
       width: 140px;
       height: 140px;
       border-radius: 50%;
       background: #e5e7eb;
       border: 8px solid #f3f4f6;
       padding: 0;
       cursor: pointer;
       display: flex;
       align-items: center;
       justify-content: center;
       transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
       box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
    }
    .inner-circle {
       width: 100%;
       height: 100%;
       border-radius: 50%;
       display: flex;
       flex-direction: column;
       align-items: center;
       justify-content: center;
       gap: 8px;
       color: #6b7280;
    }
    .mobile-ptt-btn.transmitting {
       background: #111827;
       border-color: #374151;
       transform: scale(0.95);
       box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
    }
    .mobile-ptt-btn.transmitting .inner-circle {
       color: #10b981;
    }
    .ptt-label {
       font-size: 0.65rem;
       font-weight: 900;
       letter-spacing: 0.1em;
    }
  `]
})
export class VoiceControlsComponent {
  private webrtcService = inject(WebRtcService);
  private participantService = inject(ParticipantService);
  private sanitizer = inject(DomSanitizer);
  
  isMuted = this.webrtcService.isMuted;
  isPttMode = this.webrtcService.isPttMode;
  isPttActive = this.webrtcService.isPttActive;
  isDeafened = this.webrtcService.isDeafened;
  isListenOnly = computed(() => this.participantService.localParticipant()?.isListenOnly ?? false);

  isMobile() {
    return window.innerWidth < 768;
  }

  toggleMute() {
    this.hapticFeedback();
    this.webrtcService.toggleMute();
  }

  togglePttMode() {
    this.hapticFeedback();
    this.webrtcService.togglePttMode();
  }

  toggleDeafen() {
    this.hapticFeedback();
    this.webrtcService.toggleDeafen();
  }

  toggleMobilePtt() {
    this.hapticFeedback();
    this.webrtcService.setPttActive(!this.isPttActive());
  }

  private hapticFeedback() {
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  }

  getMicIcon() {
    if (this.isListenOnly()) return this.sanitizer.bypassSecurityTrustHtml(ICONS.BLOCK);
    return this.sanitizer.bypassSecurityTrustHtml(this.isMuted() ? ICONS.MIC_OFF : ICONS.MIC);
  }

  getMicIconLarge() {
    if (this.isListenOnly()) return this.sanitizer.bypassSecurityTrustHtml(ICONS.BLOCK);
    const svg = (this.isPttActive() || !this.isMuted()) ? ICONS.MIC : ICONS.MIC_OFF;
    return this.sanitizer.bypassSecurityTrustHtml(svg.replace('width="20"', 'width="32"').replace('height="20"', 'height="32"'));
  }

  getDeafenIcon() {
    return this.sanitizer.bypassSecurityTrustHtml(this.isDeafened() ? ICONS.DEAFEN : ICONS.HEADPHONES);
  }
}
