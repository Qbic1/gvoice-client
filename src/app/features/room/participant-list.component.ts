import { Component, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParticipantService } from '../../core/services/participant.service';
import { SignalRService } from '../../core/services/signalr.service';
import { WebRtcService } from '../../core/services/webrtc.service';
import { IconService } from '../../core/services/icon.service';
import { Participant } from '../../core/models/participant.model';
import { ParticipantCardComponent } from './participant-card.component';

@Component({
  selector: 'app-participant-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ParticipantCardComponent],
  template: `
    <div class="participant-list">
      <div class="list-header">
        <h3>Participants</h3>
        <span class="count">{{ participants().length }}</span>
      </div>

      <!-- Listen-only used to be a silent downgrade: the user was moved into it
           with no message anywhere, and the only explanation lived in a title
           attribute, which touch devices never render. This names the state and
           carries the one action that resolves it. -->
      <div *ngIf="isListenOnly()" class="listen-only-notice" role="status">
        <span class="notice-icon" [innerHTML]="icons.BLOCK"></span>
        <div class="notice-body">
          <strong>Microphone blocked</strong>
          <span>You can hear everyone, but nobody can hear you. Allow the microphone in your browser, then rejoin from the lobby.</span>
        </div>
        <button type="button" class="notice-action" (click)="onRejoin.emit()">Rejoin</button>
      </div>
      <div class="cards-grid">
        <app-participant-card
          *ngFor="let p of participants()"
          [participant]="p"
          [isLocal]="p.connectionId === localConnectionId()"
          (onCardClick)="openVolumeControl(p)"
          (onWatchStream)="onWatchStream.emit(p.connectionId)"
        ></app-participant-card>
      </div>

      <!-- Volume Control Modal -->
      <div *ngIf="selectedParticipant()" class="volume-overlay" (click)="closeVolumeControl()">
        <div class="volume-card" (click)="$event.stopPropagation()">
          <div class="vol-header">
            <h4>User Volume: {{ selectedParticipant()?.displayName }}</h4>
            <button class="close-x" (click)="closeVolumeControl()">×</button>
          </div>
          
          <div class="vol-body">
            <div class="slider-container">
              <input 
                type="range" 
                min="0" 
                max="200" 
                [ngModel]="selectedParticipant()?.volume ?? 100"
                (ngModelChange)="onVolumeChange($event)"
                class="vol-slider"
              />
              <div class="slider-labels">
                <span>0%</span>
                <span>100%</span>
                <span>200%</span>
              </div>
            </div>
            <div class="vol-value">
              Current: <strong>{{ selectedParticipant()?.volume ?? 100 }}%</strong>
            </div>
          </div>

          <div class="vol-footer">
            <button class="reset-btn" (click)="resetVolume()">Reset to 100%</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .participant-list {
      width: 100%;
      position: relative;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding: 0 0.5rem;
    }
    .list-header h3 {
      margin: 0;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      font-weight: 600;
    }
    .count {
      font-size: 0.75rem;
      background: var(--bg-muted);
      padding: 2px 8px;
      border-radius: 999px;
      color: var(--text-secondary);
      font-weight: 600;
    }

    .cards-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    /* ── Volume overlay ── */
    .volume-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .volume-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 1rem;
      width: 100%;
      max-width: 320px;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      animation: popIn 0.2s ease-out;
    }
    @keyframes popIn {
      from { transform: scale(0.9); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }

    .vol-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .vol-header h4 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .close-x {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--text-muted);
      cursor: pointer;
      line-height: 1;
      transition: color 0.15s;
    }
    .close-x:hover { color: var(--text-primary); }

    .vol-body { padding: 1.5rem; }
    .slider-container { margin-bottom: 1.5rem; }
    .vol-slider {
      width: 100%;
      height: 6px;
      background: var(--bg-muted);
      border-radius: 3px;
      appearance: none;
      outline: none;
    }
    .vol-slider::-webkit-slider-thumb {
      appearance: none;
      width: 18px;
      height: 18px;
      background: var(--accent);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
    }
    .vol-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      background: var(--accent);
      border-radius: 50%;
      cursor: pointer;
      border: none;
      box-shadow: var(--shadow-sm);
    }
    .slider-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 0.5rem;
      font-size: 0.65rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .vol-value {
      text-align: center;
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .vol-footer {
      padding: 1rem;
      background: var(--bg-muted);
      display: flex;
      justify-content: center;
      border-top: 1px solid var(--border);
    }
    .reset-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s;
    }
    .reset-btn:hover {
      background: var(--bg-base);
      border-color: var(--accent);
      color: var(--accent);
    }

    /* ── Listen-only notice ── */
    .listen-only-notice {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      margin-bottom: 0.75rem;
      padding: 0.75rem;
      border-radius: 10px;
      background: color-mix(in srgb, var(--error-500) 10%, var(--bg-surface));
      border: 1px solid color-mix(in srgb, var(--error-500) 30%, transparent);
    }
    .notice-icon {
      display: flex;
      flex-shrink: 0;
      color: var(--error-500);
      margin-top: 1px;
    }
    ::ng-deep .notice-icon svg {
      width: 16px;
      height: 16px;
    }
    .notice-body {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
      flex: 1;
    }
    .notice-body strong {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--error-500);
    }
    .notice-body span {
      font-size: 0.75rem;
      line-height: 1.45;
      color: var(--text-secondary);
    }
    .notice-action {
      flex-shrink: 0;
      align-self: center;
      padding: 0.375rem 0.75rem;
      min-height: 44px;
      border-radius: 8px;
      border: 1.5px solid color-mix(in srgb, var(--error-500) 35%, transparent);
      background: var(--bg-surface);
      color: var(--error-500);
      font-family: var(--font-family);
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.06s ease-out;
    }
    .notice-action:hover {
      background: color-mix(in srgb, var(--error-500) 8%, var(--bg-surface));
      border-color: var(--error-500);
    }
    .notice-action:active {
      transform: scale(0.97);
    }
  `]
})
export class ParticipantListComponent {
  private signalrService = inject(SignalRService);
  private webrtcService = inject(WebRtcService);
  icons = inject(IconService);
  participantService = inject(ParticipantService);

  participants = this.participantService.participants;
  localConnectionId = this.signalrService.connectionId;
  selectedParticipant = signal<Participant | null>(null);

  isListenOnly = computed(() => this.participantService.localParticipant()?.isListenOnly ?? false);

  @Output() onWatchStream = new EventEmitter<string>();
  /** Leave the room so the user can re-grant the mic and come back with voice. */
  @Output() onRejoin = new EventEmitter<void>();

  openVolumeControl(participant: Participant) {
    if (participant.connectionId === this.localConnectionId()) return;
    this.selectedParticipant.set(participant);
  }

  closeVolumeControl() {
    this.selectedParticipant.set(null);
  }

  onVolumeChange(value: number) {
    if (document.hidden) return; // 🔥 prevent background spam

    const p = this.selectedParticipant();
    if (p) {
      this.webrtcService.setParticipantVolume(p.connectionId, value);
      this.selectedParticipant.set({ ...p, volume: value });
    }
  }

  resetVolume() {
    if (this.selectedParticipant()) this.onVolumeChange(100);
  }
}