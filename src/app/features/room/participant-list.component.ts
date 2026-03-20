import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParticipantService } from '../../core/services/participant.service';
import { SignalRService } from '../../core/services/signalr.service';
import { WebRtcService } from '../../core/services/webrtc.service';
import { IconService } from '../../core/services/icon.service';
import { Participant } from '../../core/models/participant.model';

@Component({
  selector: 'app-participant-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="participant-list">
      <div class="list-header">
        <h3>Room Users</h3>
        <span class="count">{{ participants().length }}</span>
      </div>
      <div class="cards-grid">
        <div *ngFor="let p of participants()" 
             class="participant-card" 
             [class.local-user]="p.connectionId === localConnectionId()"
             [class.speaking]="p.isSpeaking && !p.isMuted"
             (click)="openVolumeControl(p)">
          
          <div class="avatar" [style.background-color]="getAvatarColor(p.displayName)">
            {{ p.displayName.substring(0, 1).toUpperCase() }}
            <div *ngIf="p.isSpeaking && !p.isMuted" class="speaking-ring"></div>
          </div>

          <div class="participant-info">
            <span class="name">{{ p.displayName }}</span>
            <div class="status-indicators">
              <span *ngIf="p.isMuted" class="indicator muted" title="Muted" [innerHTML]="icons.MIC_OFF"></span>
              <span *ngIf="p.isDeafened" class="indicator deafened" title="Deafened" [innerHTML]="icons.DEAFEN"></span>
              <span *ngIf="p.isListenOnly" class="badge">Listen-only</span>
              <span *ngIf="p.connectionId !== localConnectionId() && (p.volume ?? 100) !== 100" class="vol-indicator">
                {{ p.volume }}%
              </span>
            </div>
          </div>
        </div>
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

    .participant-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 0.625rem;
      padding: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.2s;
      cursor: pointer;
    }
    .participant-card:hover {
      border-color: var(--accent);
      background: var(--accent-subtle);
    }
    .local-user {
      background: var(--accent-subtle);
      border-color: var(--border);
      cursor: default;
    }
    .local-user:hover {
      border-color: var(--border);
      background: var(--accent-subtle);
    }

    .avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 600;
      font-size: 1rem;
      position: relative;
      flex-shrink: 0;
    }
    .speaking-ring {
      position: absolute;
      top: -3px; left: -3px; right: -3px; bottom: -3px;
      border: 2px solid var(--success-500);
      border-radius: 50%;
      animation: pulse-ring 1.5s cubic-bezier(0.24, 0, 0.38, 1) infinite;
      box-shadow: 0 0 10px var(--success-500);
    }
    @keyframes pulse-ring {
      0%   { transform: scale(0.95); opacity: 1; }
      70%  { transform: scale(1.1);  opacity: 0; }
      100% { transform: scale(0.95); opacity: 0; }
    }

    .participant-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .name {
      font-weight: 500;
      font-size: 1rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-primary);
    }

    .status-indicators {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.125rem;
    }
    .badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--bg-muted);
      color: var(--text-secondary);
      font-weight: 600;
    }
    .indicator {
      display: flex;
      align-items: center;
      color: var(--text-muted);
    }
    .indicator.muted,
    .indicator.deafened {
      color: var(--error-500);
    }
    ::ng-deep .indicator svg {
      width: 16px;
      height: 16px;
    }
    .vol-indicator {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--accent);
      background: var(--accent-subtle);
      padding: 1px 4px;
      border-radius: 4px;
    }

    /* ── Volume overlay ── */
    .volume-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(2px);
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

  getAvatarColor(name: string): string {
    const colors = ['#6366f1', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  openVolumeControl(participant: Participant) {
    if (participant.connectionId === this.localConnectionId()) return;
    this.selectedParticipant.set(participant);
  }

  closeVolumeControl() {
    this.selectedParticipant.set(null);
  }

  onVolumeChange(value: number) {
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