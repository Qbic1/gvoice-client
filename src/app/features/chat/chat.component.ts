import { Component, inject, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalRService } from '../../core/services/signalr.service';
import { DisplayNameService } from '../../core/services/display-name.service';
import { ChatMessage } from '../../core/models/chat-message.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <div class="messages-list" #scrollContainer>
        <div *ngFor="let msg of messages()" class="message-wrapper" [class.local-wrapper]="msg.isLocal">
          <div class="message-item" [class.local-message]="msg.isLocal">
            <div class="msg-header">
              <span class="sender">{{ msg.displayName }} <span *ngIf="msg.isLocal">(You)</span></span>
              <span class="time">{{ msg.timestamp | date:'shortTime' }}</span>
            </div>
            <div class="msg-content">{{ msg.message }}</div>
          </div>
        </div>
      </div>
      <form (submit)="sendMessage($event)" class="chat-input-form">
        <input 
          type="text" 
          [(ngModel)]="messageInput" 
          name="message" 
          placeholder="Message room..." 
          autocomplete="off"
        />
        <button type="submit" [disabled]="!messageInput.trim()">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
          </svg>
        </button>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .messages-list {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: #fff;
    }
    .message-wrapper {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .local-wrapper {
      align-items: flex-end;
    }
    .message-item {
      max-width: 75%;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      background: #f3f4f6;
      border-bottom-left-radius: 2px;
    }
    .local-message {
      background: #111827;
      color: #fff;
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 2px;
    }
    .msg-header {
      display: flex;
      justify-content: space-between;
      gap: 1.5rem;
      font-size: 0.7rem;
      margin-bottom: 0.25rem;
      opacity: 0.7;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    .local-message .msg-header {
      color: #9ca3af;
    }
    .sender { font-weight: 700; }
    .msg-content {
      font-size: 0.9375rem;
      line-height: 1.4;
      word-break: break-word;
    }
    .chat-input-form {
      display: flex;
      padding: 1rem;
      background: #fff;
      border-top: 1px solid #e5e7eb;
      gap: 0.75rem;
    }
    .chat-input-form input {
      flex: 1;
      padding: 0.625rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.9375rem;
      transition: border-color 0.2s;
    }
    .chat-input-form input:focus {
      outline: none;
      border-color: #000;
    }
    .chat-input-form button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: #000;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .chat-input-form button:hover:not(:disabled) {
      background: #1f2937;
    }
    .chat-input-form button:disabled {
      background: #e5e7eb;
      color: #9ca3af;
      cursor: not-allowed;
    }
  `]
})
export class ChatComponent implements AfterViewChecked {
  private signalrService = inject(SignalRService);
  private displayNameService = inject(DisplayNameService);
  
  messages = signal<ChatMessage[]>([]);
  messageInput = '';

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  constructor() {
    this.signalrService.receiveChatMessage$.subscribe(data => {
      const currentLocalName = this.displayNameService.displayName();
      
      this.messages.update(list => [...list, {
        displayName: data.displayName,
        message: data.message,
        timestamp: new Date(data.timestamp),
        isLocal: data.displayName === currentLocalName
      }]);
    });

    this.signalrService.receiveChatHistory$.subscribe(history => {
      const currentLocalName = this.displayNameService.displayName();
      const mappedHistory = history.map(msg => ({
        displayName: msg.displayName,
        message: msg.message,
        timestamp: new Date(msg.timestamp),
        isLocal: msg.displayName === currentLocalName
      }));
      this.messages.set(mappedHistory);
    });
    
    this.signalrService.roomJoined$.subscribe(() => {
      // We don't clear messages here anymore because history might have been received just before.
      // If we need to clear messages when JOINING a new room, we should do it at the start of startConnection or joinRoom.
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  sendMessage(event: Event) {
    event.preventDefault();
    if (this.messageInput.trim()) {
      this.signalrService.sendChatMessage(this.messageInput.trim());
      this.messageInput = '';
    }
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      try {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      } catch (err) {}
    }
  }
}
