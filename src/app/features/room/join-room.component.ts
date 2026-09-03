import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DisplayNameService } from '../../core/services/display-name.service';
import { SignalRService } from '../../core/services/signalr.service';
import { WebRtcService } from '../../core/services/webrtc.service';
import { AvatarService } from '../../core/services/avatar.service';
import { ICONS } from '../../shared/icons';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-join-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="join-container">
      <div class="join-header">
        <button class="home-btn" (click)="goHome()" title="Back to Lobby">
          <span [innerHTML]="homeIcon"></span>
        </button>
        <h1>VoiceRoom</h1>
      </div>

      <div *ngIf="!roomId" class="error-banner">
        Invalid Room URL. Please use a valid secret link.
      </div>

      <div *ngIf="roomId">
        <p>Enter your name and password to join room <code>{{ roomId }}</code></p>
        <form (submit)="onSubmit($event)">
          <input
            type="text"
            aria-label="Display name"
            [(ngModel)]="nameInput"
            name="displayName"
            placeholder="Display Name"
            maxlength="20"
            autocomplete="nickname"
            [disabled]="isConnecting"
          />
          <input
            type="password"
            aria-label="Room password"
            [(ngModel)]="roomPassword"
            name="roomPassword"
            placeholder="Room Password"
            maxlength="64"
            autocomplete="current-password"
            [disabled]="isConnecting"
          />
          <div role="alert" aria-live="assertive">
            <div *ngIf="roomNotFoundError" class="field-error">The requested room does not exist.</div>
            <div *ngIf="passwordError" class="field-error">Incorrect room password.</div>
            <div *ngIf="roomFullError" class="field-error">The room is currently full (max 10 users).</div>
          </div>

          <label class="listen-only-label">
            <input type="checkbox" [(ngModel)]="isListenOnly" name="isListenOnly" [disabled]="isConnecting" />
            Join as Listen-only
          </label>
          <!-- The choice is locked for the session, and nothing said so. -->
          <p class="listen-only-hint">Hear everyone and use chat, without a microphone. Changing this later means rejoining.</p>
          <button type="submit" [disabled]="!nameInput.trim() || !roomPassword.trim() || isConnecting">
            {{ isConnecting ? 'Connecting...' : 'Join' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background-color: var(--bg-base);
    }
    .join-container {
      width: 100%;
      max-width: 400px;
      padding: 2.5rem;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-lg);
      text-align: center;
    }
    @media (max-width: 640px) {
      .join-container {
        height: 100%;
        max-width: none;
        border-radius: 0;
        border: none;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 1.5rem;
      }
    }
    .join-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    h1 {
      font-weight: 800;
      font-size: 1.875rem;
      color: var(--text-primary);
      margin: 0;
    }
    p {
      color: var(--text-secondary);
      margin-bottom: 2rem;
    }
    /* Tinted rather than solid: a solid fill needs its own foreground token to
       stay readable once --error-500 adapts per theme, and the tint pattern is
       what every other status surface in the app already uses. */
    .error-banner {
      background: color-mix(in srgb, var(--error-500) 12%, var(--bg-surface));
      border: 1px solid color-mix(in srgb, var(--error-500) 30%, transparent);
      color: var(--error-500);
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    form {
      display: flex;
      flex-direction: column;
    }
    input[type="text"], input[type="password"] {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      font-size: 1rem;
      background: var(--bg-base);
      color: var(--text-primary);
      transition: var(--t-interactive);
    }
    input[type="text"]::placeholder,
    input[type="password"]::placeholder {
      color: var(--text-muted);
    }
    input[type="text"]:focus, input[type="password"]:focus {
      outline: 2px solid var(--accent);
      border-color: transparent;
      box-shadow: none;
    }
    input[type="text"]:disabled, input[type="password"]:disabled {
      background: var(--bg-muted);
      color: var(--text-muted);
      cursor: not-allowed;
    }
    .listen-only-hint {
      margin: -0.25rem 0 1rem;
      font-size: 0.75rem;
      line-height: 1.45;
      color: var(--text-muted);
      text-align: left;
    }
    .listen-only-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
      color: var(--text-secondary);
      cursor: pointer;
    }
    .field-error {
      color: var(--error-500);
      font-size: 0.875rem;
      text-align: left;
      margin-top: -0.5rem;
      margin-bottom: 1rem;
    }
    button[type="submit"] {
      padding: 0.875rem 1.5rem;
      background: var(--accent);
      color: var(--on-accent);
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
      transition: var(--t-interactive);
      box-shadow: var(--shadow-sm);
    }
    
    @media (hover: hover) and (pointer: fine) {
      button[type="submit"]:hover:not(:disabled) {
        background: var(--accent-hover);
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
      }
    }
    button[type="submit"]:disabled {
      background: var(--bg-muted);
      color: var(--text-muted);
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }
    .home-btn {
      padding: 0.4rem;
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: var(--t-interactive);
    }
    
    @media (hover: hover) and (pointer: fine) {
      .home-btn:hover {
        background: var(--bg-muted);
        color: var(--text-primary);
      }
    }
    code {
      background: var(--accent-subtle);
      padding: 0.1rem 0.4rem;
      border-radius: 0.25rem;
      font-size: 0.9em;
      color: var(--accent);
    }
  `]
})
export class JoinRoomComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private displayNameService = inject(DisplayNameService);
  private signalrService = inject(SignalRService);
  private webrtcService = inject(WebRtcService);
  private avatarService = inject(AvatarService);
  private sanitizer = inject(DomSanitizer);

  private readonly PWD_STORAGE_KEY_PREFIX = 'gvoice_pwd_';
  private subscriptions = new Subscription();

  homeIcon = this.sanitizer.bypassSecurityTrustHtml(ICONS.HOME);

  roomId: string | null = null;
  nameInput = this.displayNameService.displayName() || '';
  roomPassword = '';
  passwordError = false;
  roomNotFoundError = false;
  roomFullError = false;
  isListenOnly = false;
  isConnecting = false;

  constructor() {
    const reset = () => {
      this.isConnecting = false;
      this.signalrService.disconnect();
    };

    this.subscriptions.add(this.signalrService.invalidPassword$.subscribe(() => {
      this.passwordError = true;
      reset();
    }));

    this.subscriptions.add(this.signalrService.roomNotFound$.subscribe(() => {
      this.roomNotFoundError = true;
      reset();
    }));

    this.subscriptions.add(this.signalrService.roomFull$.subscribe(() => {
      this.roomFullError = true;
      reset();
    }));

    this.subscriptions.add(this.signalrService.roomJoined$.subscribe(() => {
      if (this.roomId) {
        localStorage.setItem(`${this.PWD_STORAGE_KEY_PREFIX}${this.roomId}`, this.roomPassword);
      }
    }));
  }

  ngOnInit() {
    this.signalrService.disconnect();
    this.extractRoomId();

    this.subscriptions.add(this.router.events.subscribe(() => {
      this.extractRoomId();
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  goHome() {
    this.router.navigate(['/']);
  }

  private extractRoomId() {
    const paramId = this.route.snapshot.paramMap.get('roomId');
    if (paramId) {
      this.roomId = paramId;
      const savedPassword = localStorage.getItem(`${this.PWD_STORAGE_KEY_PREFIX}${paramId}`);
      if (savedPassword) this.roomPassword = savedPassword;
      return;
    }

    const path = window.location.pathname;
    const segments = path.split('/');
    const roomIndex = segments.indexOf('room');

    if (roomIndex !== -1 && segments[roomIndex + 1]) {
      this.roomId = segments[roomIndex + 1];
      const savedPassword = localStorage.getItem(`${this.PWD_STORAGE_KEY_PREFIX}${this.roomId}`);
      if (savedPassword) this.roomPassword = savedPassword;
    }
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    if (!this.roomId || !this.nameInput.trim() || !this.roomPassword.trim() || this.isConnecting) return;

    this.isConnecting = true;
    this.passwordError = false;
    this.roomNotFoundError = false;
    this.displayNameService.saveName(this.nameInput);
    const name = this.displayNameService.displayName()!;

    try {
      const connected = await this.signalrService.startConnection(this.roomId);
      if (!connected) { this.isConnecting = false; return; }

      if (!this.isListenOnly) {
        const stream = await this.webrtcService.getLocalStream();
        if (!stream) this.isListenOnly = true;
      }

      // Avatar goes in with Join so nobody ever renders the default face first,
      // and so the reconnect replay carries it without a separate broadcast.
      await this.signalrService.joinRoom(this.roomId, this.roomPassword, name, this.isListenOnly, this.avatarService.avatarId());
    } catch (err) {
      console.error('Failed to join:', err);
      this.isConnecting = false;
    }
  }
}