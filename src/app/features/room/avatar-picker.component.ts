import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { AVATARS, AvatarId, newRandomAvatarId } from '../../shared/avatars';
import { AvatarFaceComponent } from '../../shared/components/avatar-face.component';
import { FocusTrapDirective } from '../../shared/directives/focus-trap.directive';

/**
 * The avatar picker, opened by clicking your own participant card.
 *
 * Built on the same overlay shape as the per-user volume dialog — scrim, focus
 * trap, Escape, backdrop dismissal — so the room has one dialog behaviour
 * rather than two.
 *
 * Picking closes the dialog: the choice is broadcast immediately, so a separate
 * confirm step would only add a click to an action that is already reversible.
 */
@Component({
  selector: 'app-avatar-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarFaceComponent, FocusTrapDirective],
  template: `
    <div class="picker-overlay" (click)="dismiss.emit()">
      <div class="picker-card" role="dialog" aria-modal="true"
           aria-labelledby="avatar-picker-title" appFocusTrap
           (click)="$event.stopPropagation()">
        <div class="pick-header">
          <h4 id="avatar-picker-title">Выбери уебище</h4>
          <button type="button" class="close-x" aria-label="Закрыть" (click)="dismiss.emit()">×</button>
        </div>

        <div class="pick-grid">
          @for (a of avatars; track a.id) {
            <button type="button" class="tile"
                    [class.selected]="a.id === current()"
                    [attr.aria-pressed]="a.id === current()"
                    [title]="a.name"
                    [attr.aria-label]="a.name"
                    (click)="choose.emit(a.id)">
              <app-avatar-face [id]="a.id" [size]="44" [seed]="a.id"
                               [decorative]="true" [blink]="false" />
              <!-- The adjective alone. The noun lives in the dialog title, which
                   is what keeps every tile label the same short shape. -->
              <span class="tile-name">{{ a.short }}</span>
            </button>
          }
        </div>

        <!-- Rolled avatars sit apart from the grid rather than becoming an
             eleventh tile: eleven breaks the two clean rows, and this is a
             different kind of action — you are not picking a face, you are
             agreeing to be handed one. Each press rolls a fresh seed. -->
        <div class="pick-footer">
          <button type="button" class="roll" (click)="choose.emit(rollNew())">
            <svg class="roll-face" viewBox="0 0 44 44" aria-hidden="true">
              <rect width="44" height="44" rx="9" fill="currentColor" opacity=".18"/>
              <text x="22" y="31" text-anchor="middle" font-size="24" font-weight="800">?</text>
            </svg>
            <span class="roll-copy">
              <strong>Рандомное уебище</strong>
              <em>Случайная морда, свои цвета. Жми ещё раз — будет другое.</em>
            </span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .picker-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .picker-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 1rem;
      width: 100%;
      max-width: 420px;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      animation: popIn 0.2s ease-out;
    }
    @keyframes popIn {
      from { transform: scale(0.9); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }

    .pick-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .pick-header h4 {
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
    @media (hover: hover) and (pointer: fine) {
      .close-x:hover { color: var(--text-primary); }
    }

    /* Five columns makes two clean rows of ten. Below 420px five columns squeeze
       the tile under the width its label needs, so it drops to four and accepts
       a ragged last row — a readable name beats a tidy grid. */
    .pick-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.5rem;
      padding: 1rem;
    }
    @media (max-width: 420px) {
      .pick-grid { grid-template-columns: repeat(4, 1fr); }
    }

    .tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.25rem;
      min-width: 0;
      background: var(--bg-surface);
      border: 1.5px solid transparent;
      border-radius: 10px;
      cursor: pointer;
      font-family: var(--font-family);
      transition: var(--t-interactive);
    }
    @media (hover: hover) and (pointer: fine) {
      .tile:hover { background: var(--bg-base); border-color: var(--border); }
    }
    .tile:active { transform: scale(0.97); }
    .tile.selected {
      background: var(--accent-subtle);
      border-color: var(--accent);
    }

    /* The face is authored at 44 and stretched to the column, so the grid stays
       responsive without the component having to know the viewport. */
    .tile app-avatar-face { width: 100%; }
    ::ng-deep .tile app-avatar-face svg { width: 100%; height: auto; }

    .tile-name {
      font-size: 0.6rem;
      font-weight: 700;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
    .tile.selected .tile-name { color: var(--accent); }

    .pick-footer {
      padding: 0 1rem 1rem;
    }
    .roll {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.625rem 0.75rem;
      text-align: left;
      background: var(--bg-base);
      border: 1.5px dashed color-mix(in srgb, var(--border) 80%, transparent);
      border-radius: 10px;
      cursor: pointer;
      color: var(--text-secondary);
      font-family: var(--font-family);
      transition: var(--t-interactive);
    }
    @media (hover: hover) and (pointer: fine) {
      .roll:hover { border-color: var(--accent); color: var(--accent); }
    }
    .roll:active { transform: scale(0.99); }
    .roll-face {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      fill: currentColor;
    }
    .roll-face text { font-family: var(--font-family); fill: currentColor; }
    .roll-copy { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .roll-copy strong {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .roll-copy em {
      font-style: normal;
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--text-muted);
    }
  `],
})
export class AvatarPickerComponent {
  current = input.required<AvatarId>();

  choose = output<AvatarId>();
  dismiss = output<void>();

  protected readonly avatars = AVATARS;

  /** A fresh seed per press, so the button keeps working after the first roll. */
  protected rollNew(): AvatarId {
    return newRandomAvatarId();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.dismiss.emit();
  }
}
