import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Participant } from '../../core/models/participant.model';
import { IconService } from '../../core/services/icon.service';

@Component({
  selector: 'app-participant-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="participant-card" 
         [class.local-user]="isLocal()"
         [class.speaking]="participant().isSpeaking && !participant().isMuted"
         (click)="onCardClick.emit()">
      
      <div class="avatar" [style.background-color]="getAvatarColor(participant().displayName)">
        {{ participant().displayName.substring(0, 1).toUpperCase() }}
        <div *ngIf="participant().isSpeaking && !participant().isMuted" class="speaking-ring"></div>
      </div>

      <div class="participant-info">
        <div class="name-row">
          <span class="name">{{ participant().displayName }}</span>
          <span *ngIf="participant().isSharingScreen" 
                class="stream-badge" 
                [class.disabled]="isLocal()"
                [title]="isLocal() ? 'You are sharing' : 'Watch Stream'"
                (click)="$event.stopPropagation(); !isLocal() && onWatchStream.emit()">
            <span class="icon" [innerHTML]="icons.EYE"></span>
          </span>
        </div>
        <div class="status-indicators">
          <span *ngIf="participant().isMuted" class="indicator muted" title="Muted" [innerHTML]="icons.MIC_OFF"></span>
          <span *ngIf="participant().isDeafened" class="indicator deafened" title="Deafened" [innerHTML]="icons.DEAFEN"></span>
          <span *ngIf="participant().isListenOnly" class="badge">Listen-only</span>
          <span *ngIf="!isLocal() && (participant().volume ?? 100) !== 100" class="vol-indicator">
            {{ participant().volume }}%
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
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
    .name-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .name {
      font-weight: 500;
      font-size: 1rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-primary);
    }

    .stream-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent);
      background: var(--accent-subtle);
      width: 24px;
      height: 24px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
    }
    .stream-badge:hover {
      background: var(--accent);
      color: #fff;
    }
    .stream-badge.disabled {
      cursor: default;
      opacity: 0.6;
    }
    .stream-badge.disabled:hover {
      background: var(--accent-subtle);
      color: var(--accent);
    }
    .stream-badge .icon {
      display: flex;
    }
    ::ng-deep .stream-badge svg {
      width: 14px;
      height: 14px;
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
  `]
})
export class ParticipantCardComponent {
  participant = input.required<Participant>();
  isLocal = input<boolean>(false);
  
  onCardClick = output<void>();
  onWatchStream = output<void>();

  icons = inject(IconService);

  getAvatarColor(name: string): string {
    const colors = ['#6366f1', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
