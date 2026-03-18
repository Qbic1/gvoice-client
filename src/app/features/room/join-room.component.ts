import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DisplayNameService } from '../../core/services/display-name.service';
import { SignalRService } from '../../core/services/signalr.service';
import { WebRtcService } from '../../core/services/webrtc.service';

@Component({
  selector: 'app-join-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="join-container">
      <h1>VoiceRoom</h1>
      
      <div *ngIf="!roomId" class="error-banner">
        Invalid Room URL. Please use a valid secret link.
      </div>

      <div *ngIf="roomId">
        <p>Enter your name and room password to join</p>
        <form (submit)="onSubmit($event)">
          <input 
            type="text" 
            [(ngModel)]="nameInput" 
            name="displayName" 
            placeholder="Display Name"
            maxlength="20"
            [disabled]="isConnecting"
          />
          <input 
            type="password" 
            [(ngModel)]="roomPassword" 
            name="roomPassword" 
            placeholder="Room Password"
            [disabled]="isConnecting"
          />
          <div *ngIf="roomNotFoundError" class="field-error">The requested room does not exist.</div>
          <div *ngIf="passwordError" class="field-error">Incorrect room password.</div>
          
          <label class="listen-only-label">
            <input type="checkbox" [(ngModel)]="isListenOnly" name="isListenOnly" [disabled]="isConnecting" />
            Join as Listen-only
          </label>
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
      background-color: var(--gray-100);
    }
    .join-container {
      width: 100%;
      max-width: 400px;
      padding: 2.5rem;
      background: #fff;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-lg);
      text-align: center;
    }
    @media (max-width: 640px) {
      .join-container {
        height: 100%;
        max-width: none;
        border-radius: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 1.5rem;
      }
    }
    h1 {
      font-weight: 800;
      font-size: 1.875rem;
      color: var(--gray-900);
      margin-top: 0;
      margin-bottom: 0.5rem;
    }
    p {
      color: var(--gray-600);
      margin-bottom: 2rem;
    }
    .error-banner {
      background: var(--error-500);
      color: #fff;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      font-weight: 500;
    }
    form {
      display: flex;
      flex-direction: column;
    }
    input[type="text"], input[type="password"] {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--gray-300);
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      font-size: 1rem;
      transition: all 0.2s ease;
    }
    input[type="text"]:focus, input[type="password"]:focus {
      outline: 2px solid var(--primary-400);
      border-color: transparent;
      box-shadow: none;
    }
    .listen-only-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
      color: var(--gray-700);
      cursor: pointer;
    }
    .field-error {
      color: var(--error-500);
      font-size: 0.875rem;
      text-align: left;
      margin-top: -0.5rem;
      margin-bottom: 1rem;
    }
    button {
      padding: 0.875rem 1.5rem;
      background: var(--primary-600);
      color: #fff;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);
    }
    button:hover {
      background: var(--primary-700);
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }
    button:disabled {
      background-color: var(--gray-300);
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }
  `]
})
export class JoinRoomComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private displayNameService = inject(DisplayNameService);
  private signalrService = inject(SignalRService);
  private webrtcService = inject(WebRtcService);
  
  private readonly PWD_STORAGE_KEY_PREFIX = 'gvoice_pwd_';
  private subscriptions = new Subscription();

  roomId: string | null = null;
  nameInput = this.displayNameService.displayName() || '';
  roomPassword = '';
  passwordError = false;
  roomNotFoundError = false;
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

    this.subscriptions.add(this.signalrService.roomJoined$.subscribe(() => {
      if (this.roomId) {
        localStorage.setItem(`${this.PWD_STORAGE_KEY_PREFIX}${this.roomId}`, this.roomPassword);
      }
    }));
  }

  ngOnInit() {
    // On init, ensure we are in a disconnected state from any previous attempts
    this.signalrService.disconnect();
    this.extractRoomId();
    
    this.subscriptions.add(this.router.events.subscribe(() => {
      this.extractRoomId();
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private extractRoomId() {
    const paramId = this.route.snapshot.paramMap.get('roomId');
    if (paramId) {
      this.roomId = paramId;
      const savedPassword = localStorage.getItem(`${this.PWD_STORAGE_KEY_PREFIX}${paramId}`);
      if (savedPassword) {
        this.roomPassword = savedPassword;
      }
      return;
    }

    const path = window.location.pathname;
    const segments = path.split('/');
    const roomIndex = segments.indexOf('room');
    
    if (roomIndex !== -1 && segments[roomIndex + 1]) {
      this.roomId = segments[roomIndex + 1];
      const savedPassword = localStorage.getItem(`${this.PWD_STORAGE_KEY_PREFIX}${this.roomId}`);
      if (savedPassword) {
        this.roomPassword = savedPassword;
      }
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
      if (!connected) {
        this.isConnecting = false;
        // Optionally show a generic connection error here
        return;
      }

      if (!this.isListenOnly) {
        const stream = await this.webrtcService.getLocalStream();
        if (!stream) {
          this.isListenOnly = true;
        }
      }
      
      await this.signalrService.joinRoom(this.roomId, this.roomPassword, name, this.isListenOnly);
    } catch (err) {
      console.error('Failed to join:', err);
      this.isConnecting = false;
    }
  }
}

// Add the new error message to the template
const template = `
<div *ngIf="roomNotFoundError" class="field-error">Room not found. Please check the URL.</div>
<div *ngIf="passwordError" class="field-error">Incorrect room password</div>
`;

// It's not possible to append to the template, so I'll just note that this should be added.
// I will now add the roomNotFoundError to the component's template.

