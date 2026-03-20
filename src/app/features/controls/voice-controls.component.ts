import { Component, inject, computed, signal, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebRtcService } from '../../core/services/webrtc.service';
import { ParticipantService } from '../../core/services/participant.service';
import { IconService } from '../../core/services/icon.service';

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

      <!-- Mobile PTT Button -->
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

    /* ── Button group ── */
    .button-group {
      display: flex;
      background: var(--bg-muted);
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
      background: var(--bg-surface);
      cursor: pointer;
      transition: all 0.2s;
      color: var(--text-secondary);
      box-shadow: var(--shadow-sm);
    }
    .control-btn:hover:not(:disabled) {
      background: var(--bg-base);
      color: var(--text-primary);
      transform: translateY(-1px);
    }

    /* ── States ── */
    .control-btn.active {
      color: var(--success-500);
    }
    .control-btn.muted {
      color: var(--error-500);
      background: color-mix(in srgb, var(--error-500) 12%, var(--bg-surface));
    }
    .ptt-toggle.ptt-active {
      background: var(--text-primary);
      color: var(--bg-surface);
    }
    .ptt-toggle.ptt-active:hover:not(:disabled) {
      background: var(--text-secondary);
      color: var(--bg-surface);
    }
    .control-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: var(--bg-muted);
      color: var(--text-muted);
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

    /* ── Mode label ── */
    .mode-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .mode-label.ptt {
      color: var(--text-primary);
    }

    .mt-2 { margin-top: 0.5rem; }
    .mt-6 { margin-top: 1.5rem; }

    /* ── Mobile PTT ── */
    .mobile-ptt-container {
      width: 100%;
      display: flex;
      justify-content: center;
    }
    .mobile-ptt-btn {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: var(--bg-muted);
      border: 8px solid var(--bg-base);
      padding: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--shadow-md);
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
      color: var(--text-muted);
    }
    .mobile-ptt-btn.transmitting {
      background: var(--text-primary);
      border-color: var(--text-secondary);
      transform: scale(0.95);
      box-shadow: 0 0 20px color-mix(in srgb, var(--success-500) 30%, transparent);
    }
    .mobile-ptt-btn.transmitting .inner-circle {
      color: var(--success-500);
    }
    .ptt-label {
      font-size: 0.65rem;
      font-weight: 900;
      letter-spacing: 0.1em;
    }
  `]
})
export class VoiceControlsComponent implements OnInit {
  private webrtcService = inject(WebRtcService);
  private participantService = inject(ParticipantService);
  icons = inject(IconService);

  isMuted = this.webrtcService.isMuted;
  isPttMode = this.webrtcService.isPttMode;
  isPttActive = this.webrtcService.isPttActive;
  isDeafened = this.webrtcService.isDeafened;
  isListenOnly = computed(() => this.participantService.localParticipant()?.isListenOnly ?? false);

  isMobile = signal(false);

  ngOnInit() { this.checkWidth(); }

  @HostListener('window:resize')
  onResize() { this.checkWidth(); }

  private checkWidth() {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }

  toggleMute()     { this.hapticFeedback(); this.webrtcService.toggleMute(); }
  togglePttMode()  { this.hapticFeedback(); this.webrtcService.togglePttMode(); }
  toggleDeafen()   { this.hapticFeedback(); this.webrtcService.toggleDeafen(); }
  toggleMobilePtt(){ this.hapticFeedback(); this.webrtcService.setPttActive(!this.isPttActive()); }

  private hapticFeedback() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  }

  getMicIcon() {
    if (this.isListenOnly()) return this.icons.BLOCK;
    return this.isMuted() ? this.icons.MIC_OFF : this.icons.MIC;
  }

  getMicIconLarge() {
    if (this.isListenOnly()) return this.icons.BLOCK;
    return (this.isPttActive() || !this.isMuted()) ? this.icons.MIC : this.icons.MIC_OFF;
  }

  getDeafenIcon() {
    return this.isDeafened() ? this.icons.DEAFEN : this.icons.HEADPHONES;
  }
}