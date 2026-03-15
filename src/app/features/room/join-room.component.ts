import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
      <p>Enter your name to join the room</p>
      <form (submit)="onSubmit($event)">
        <input 
          type="text" 
          [(ngModel)]="nameInput" 
          name="displayName" 
          placeholder="Display Name (e.g. Brave Badger)"
          maxlength="20"
        />
        <label class="listen-only-label">
          <input type="checkbox" [(ngModel)]="isListenOnly" name="isListenOnly" />
          Join as Listen-only
        </label>
        <button type="submit">Join</button>
      </form>
    </div>
  `,
  styles: [`
    .join-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: sans-serif;
    }
    input[type="text"] {
      padding: 10px;
      margin: 10px 0;
      border: 1px solid #ccc;
      border-radius: 4px;
      width: 250px;
    }
    .listen-only-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      margin-bottom: 10px;
      cursor: pointer;
    }
    button {
      padding: 10px 20px;
      background-color: #000;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    }
  `]
})
export class JoinRoomComponent {
  private displayNameService = inject(DisplayNameService);
  private signalrService = inject(SignalRService);
  private webrtcService = inject(WebRtcService);
  
  nameInput = this.displayNameService.displayName() || '';
  isListenOnly = false;

  async onSubmit(event: Event) {
    event.preventDefault();
    console.log('Join button clicked. Name:', this.nameInput, 'ListenOnly:', this.isListenOnly);
    this.displayNameService.saveName(this.nameInput);
    const name = this.displayNameService.displayName()!;
    
    console.log('Starting SignalR connection...');
    await this.signalrService.startConnection();

    if (!this.isListenOnly) {
      console.log('Requesting microphone access...');
      const stream = await this.webrtcService.getLocalStream();
      if (!stream) {
        console.warn('Microphone access denied or failed. Joining in listen-only mode.');
        this.isListenOnly = true;
      }
    }
    
    console.log('Joining room...');
    await this.signalrService.joinRoom(name, this.isListenOnly);
  }
}
