import { ChangeDetectionStrategy, Component, computed, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Participant } from '../../core/models/participant.model';
import { IconService } from '../../core/services/icon.service';
import { AvatarFaceComponent } from '../../shared/components/avatar-face.component';
import { AvatarMotifComponent } from '../../shared/components/avatar-motif.component';
import { avatarDef, resolveAvatarId } from '../../shared/avatars';

@Component({
  selector: 'app-participant-card',
  standalone: true,
  imports: [CommonModule, AvatarFaceComponent, AvatarMotifComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="participant-card"
         [style.--av-ink]="avatar().ink"
         [class.local-user]="isLocal()"
         [class.speaking]="isSpeaking()"
         [attr.tabindex]="isLocal() ? 0 : null"
         [attr.role]="isLocal() ? 'button' : null"
         [attr.title]="isLocal() ? 'Сменить уебище' : null"
         [attr.aria-label]="isLocal() ? 'Сменить уебище. Сейчас: ' + avatar().name : null"
         (keydown.enter)="isLocal() && onCardClick.emit()"
         (click)="onCardClick.emit()">

      <app-avatar-motif [id]="avatar().id" />

      <div class="avatar">
        <app-avatar-face
          [id]="avatar().id"
          [size]="44"
          [speaking]="isSpeaking()"
          [muted]="participant().isMuted"
          [deafened]="participant().isDeafened"
          [seed]="participant().connectionId"
          [decorative]="true" />
        <div *ngIf="isSpeaking()" class="speaking-ring"></div>
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
          <span class="avatar-name">{{ avatar().name }}</span>
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
    /* Each avatar brings its own ground: a tint plus a motif drawn in its own
       ink. Identity lives in the *pattern*, state in the colour underneath — so
       speaking can repaint the fill without the card losing whose it is, and ten
       cards stay distinguishable without ten of them shouting. */
    .participant-card {
      background-color: var(--bg-surface);
      background-image:
        linear-gradient(180deg,
          color-mix(in srgb, var(--av-ink) 14%, transparent),
          color-mix(in srgb, var(--av-ink) 5%, transparent));
      border: 1px solid color-mix(in srgb, var(--av-ink) 30%, var(--border));
      position: relative;
      overflow: hidden;
      border-radius: 0.625rem;
      padding: 0.75rem;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: var(--t-interactive);
      cursor: pointer;
    }
    
    @media (hover: hover) and (pointer: fine) {
      .participant-card:hover {
        border-color: var(--accent);
        background: var(--accent-subtle);
      }
    }
    /* Speaking, stated without motion: the ring animates, this does not. Only
       the ground colour changes — the motif stays, so a talking card is still
       recognisably that person's. */
    .participant-card.speaking {
      border-color: var(--success-500);
      background-color: color-mix(in srgb, var(--success-500) 8%, var(--bg-surface));
      background-image: none;
    }
    /* "This is you" outranks the avatar tint — you must be able to find
       yourself in the list before you can admire your own face. */
    .local-user {
      background-color: var(--accent-subtle);
      background-image: none;
      border-color: var(--border);
      cursor: pointer;
    }

    @media (hover: hover) and (pointer: fine) {
      .local-user:hover {
        border-color: var(--accent);
        background: var(--accent-subtle);
      }
    }

    .avatar {
      position: relative;
      z-index: 1;
      width: 44px;
      height: 44px;
      display: flex;
      position: relative;
      flex-shrink: 0;
    }
    /* One ring, not two: this used to set both border and outline in the same
       color, drawing a doubled 4px edge. */
    .speaking-ring {
      position: absolute;
      top: -3px; left: -3px; right: -3px; bottom: -3px;
      border: 3px solid var(--success-500);
      /* The portrait is a 9px squircle, and the ring sits 3px outside it. */
      border-radius: 12px;
      animation: pulse-ring 1.5s cubic-bezier(0.24, 0, 0.38, 1) infinite;
    }
    @keyframes pulse-ring {
      0%   { transform: scale(0.95); opacity: 1; }
      70%  { transform: scale(1.1);  opacity: 0; }
      100% { transform: scale(0.95); opacity: 0; }
    }



    .participant-info {
      position: relative;
      z-index: 1;
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
      transition: var(--t-interactive);
      border: 1px solid transparent;
    }
    
    @media (hover: hover) and (pointer: fine) {
      .stream-badge:hover {
        background: var(--accent);
        color: var(--on-accent);
      }
    }
    .stream-badge.disabled {
      cursor: default;
      opacity: 0.6;
    }
    
    @media (hover: hover) and (pointer: fine) {
      .stream-badge.disabled:hover {
        background: var(--accent-subtle);
        color: var(--accent);
      }
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
      min-width: 0;
    }

    /* Rides the status row rather than taking a line of its own: with ten cards
       in a column, a third line costs more than this label is worth. It shrinks
       before the state glyphs do — identity yields to state here as everywhere. */
    .avatar-name {
      flex: 0 1 auto;
      min-width: 0;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .badge {
      flex-shrink: 0;
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
      flex-shrink: 0;
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
      flex-shrink: 0;
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

  /** Muted wins: a muted participant does not get a speaking ring or a moving mouth. */
  protected isSpeaking = computed(() => !!this.participant().isSpeaking && !this.participant().isMuted);

  protected avatar = computed(() => {
    const p = this.participant();
    return avatarDef(resolveAvatarId(p.avatar, p.displayName));
  });
}
