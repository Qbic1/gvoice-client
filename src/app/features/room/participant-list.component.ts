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
            <span class="name">
              {{ p.displayName }}
            </span>
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

      <!-- Volume Control Modal/Popover -->
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
      color: var(--gray-500);
      font-weight: 600;
    }
    .count {
      font-size: 0.75rem;
      background: var(--gray-200);
      padding: 2px 8px;
      border-radius: 999px;
      color: var(--gray-600);
      font-weight: 600;
    }
    .cards-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .participant-card {
      background: #fff;
      border: 1px solid var(--gray-100);
      border-radius: 0.625rem;
      padding: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.2s;
      cursor: pointer;
    }
    .participant-card:hover {
      border-color: var(--primary-300);
      background: var(--gray-50);
    }
    .local-user {
      background: var(--primary-50);
      cursor: default;
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
      top: -3px;
      left: -3px;
      right: -3px;
      bottom: -3px;
      border: 2px solid var(--success-500);
      border-radius: 50%;
      animation: pulse-ring 1.5s cubic-bezier(0.24, 0, 0.38, 1) infinite;
      box-shadow: 0 0 10px var(--success-500);
    }
    @keyframes pulse-ring {
      0% { transform: scale(0.95); opacity: 1; }
      70% { transform: scale(1.1); opacity: 0; }
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
      color: var(--gray-800);
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
      background: var(--secondary-200);
      color: var(--secondary-700);
      font-weight: 600;
    }
    .indicator {
      display: flex;
      align-items: center;
      color: var(--gray-400);
    }
    .indicator.muted, .indicator.deafened {
      color: var(--error-500);
    }
    ::ng-deep .indicator svg {
      width: 16px;
      height: 16px;
    }
    .vol-indicator {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--primary-600);
      background: var(--primary-50);
      padding: 1px 4px;
      border-radius: 4px;
    }

    /* Volume Overlay */
    .volume-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(2px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .volume-card {
      background: #fff;
      border-radius: 1rem;
      width: 100%;
      max-width: 320px;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      animation: popIn 0.2s ease-out;
    }
    @keyframes popIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .vol-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--gray-100);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .vol-header h4 { margin: 0; font-size: 0.875rem; color: var(--gray-600); }
    .close-x {
      background: none; border: none; font-size: 1.5rem; color: var(--gray-400); cursor: pointer; line-height: 1;
    }
    .vol-body { padding: 1.5rem; }
    .slider-container { margin-bottom: 1.5rem; }
    .vol-slider {
      width: 100%;
      height: 6px;
      background: var(--gray-200);
      border-radius: 3px;
      appearance: none;
      outline: none;
    }
    .vol-slider::-webkit-slider-thumb {
      appearance: none;
      width: 18px;
      height: 18px;
      background: var(--primary-600);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
    }
    .slider-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 0.5rem;
      font-size: 0.65rem;
      color: var(--gray-400);
      font-weight: 600;
    }
    .vol-value { text-align: center; color: var(--gray-800); }
    .vol-footer {
      padding: 1rem;
      background: var(--gray-50);
      display: flex;
      justify-content: center;
    }
    .reset-btn {
      background: #fff;
      border: 1px solid var(--gray-300);
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--gray-700);
      cursor: pointer;
    }
    .reset-btn:hover { background: var(--gray-100); }
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
      // Update local signal to reflect change in real-time in the modal
      this.selectedParticipant.set({ ...p, volume: value });
    }
  }

  resetVolume() {
    const p = this.selectedParticipant();
    if (p) {
      this.onVolumeChange(100);
    }
  }
}
