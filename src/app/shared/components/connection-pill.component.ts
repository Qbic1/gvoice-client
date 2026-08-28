import { Component, computed, inject } from '@angular/core';
import { SignalRService } from '../../core/services/signalr.service';

/**
 * The in-room connection readout.
 *
 * This used to be a hardcoded "Connected" string duplicated in both layout
 * shells, which meant it kept claiming a live connection during the one window
 * where the indicator actually earns its keep: `Reconnecting` deliberately
 * leaves the room mounted, so the pill stayed green while voice was going
 * nowhere. It now reads the hub state, and Voice Green is spent only on a
 * connection that is genuinely up.
 *
 * The dot is steady at rest — a permanent blink carries no information and
 * costs a compositing pass for every hour the tab sits in the background. It
 * blinks only while reconnecting, on the same 1.2s cadence as the reconnect
 * banner's dot, so the two read as one event.
 */
@Component({
  selector: 'app-connection-pill',
  standalone: true,
  template: `
    <div class="connection-pill" [class.reconnecting]="isReconnecting()" role="status">
      <span class="dot"></span>{{ label() }}
    </div>
  `,
  styles: [`
    .connection-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      align-self: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      white-space: nowrap;
      color: var(--success-500);
      background: color-mix(in srgb, var(--success-500) 12%, var(--bg-surface));
      border: 1px solid color-mix(in srgb, var(--success-500) 25%, transparent);
      transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
    }
    .connection-pill.reconnecting {
      color: var(--error-500);
      background: color-mix(in srgb, var(--error-500) 12%, var(--bg-surface));
      border-color: color-mix(in srgb, var(--error-500) 30%, transparent);
    }

    .dot {
      width: 8px;
      height: 8px;
      min-width: 8px;
      min-height: 8px;
      border-radius: 50%;
      display: block;
      background: var(--success-500);
    }
    .reconnecting .dot {
      background: var(--error-500);
      animation: pill-blink 1.2s infinite;
    }
    @keyframes pill-blink {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.3; }
    }
    @media (prefers-reduced-motion: reduce) {
      .reconnecting .dot { animation: none; }
    }
  `]
})
export class ConnectionPillComponent {
  private signalrService = inject(SignalRService);

  private status = this.signalrService.connectionStatus;

  isReconnecting = computed(() => this.status() === 'Reconnecting');

  label = computed(() => this.status() === 'Reconnecting' ? 'Reconnecting' : 'Connected');
}
