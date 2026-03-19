import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipantService } from '../../core/services/participant.service';
import { SignalRService } from '../../core/services/signalr.service';
import { IconService } from '../../core/services/icon.service';

@Component({
  selector: 'app-participant-list',
  standalone: true,
  imports: [CommonModule],
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
             [class.speaking]="p.isSpeaking && !p.isMuted">
          
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
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .participant-list {
      width: 100%;
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
      border: 1px solid transparent;
      border-radius: 0.625rem;
      padding: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.2s;
    }
    .local-user {
      background: var(--primary-50);
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
  `]
})
export class ParticipantListComponent {
  private signalrService = inject(SignalRService);
  icons = inject(IconService);
  participantService = inject(ParticipantService);
  
  participants = this.participantService.participants;
  localConnectionId = this.signalrService.connectionId;

  getAvatarColor(name: string): string {
    const colors = ['#6366f1', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
