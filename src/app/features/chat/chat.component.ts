import { Component, inject, signal, ElementRef, ViewChild, AfterViewChecked, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalRService } from '../../core/services/signalr.service';
import { DisplayNameService } from '../../core/services/display-name.service';
import { ChatMessage } from '../../core/models/chat-message.model';
import { LinkifyPipe } from '../../shared/pipes/linkify.pipe';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, LinkifyPipe],
  template: `
    <div class="chat-container">
      <div class="messages-list" #scrollContainer>
        <div *ngFor="let msg of messages()" class="message-wrapper" [class.local-wrapper]="msg.isLocal">
          <div class="message-item" [class.local-message]="msg.isLocal">
            <div class="msg-header">
              <span class="sender">{{ msg.displayName }} <span *ngIf="msg.isLocal">(You)</span></span>
              <span class="time">{{ msg.timestamp | date:'shortTime' }}</span>
            </div>
            <div class="msg-content">
              <div *ngIf="isImage(msg.message)" class="image-bubble">
                <img [src]="msg.message" alt="Shared image" (click)="openLightbox(msg.message)" />
              </div>
              <div *ngIf="!isImage(msg.message)" [innerHTML]="msg.message | linkify"></div>
            </div>
          </div>
        </div>
      </div>

      <form (submit)="sendMessage($event)" class="chat-input-form">
        <input 
          type="text" 
          [(ngModel)]="messageInput" 
          name="message" 
          placeholder="Message or paste image..." 
          autocomplete="off"
          (paste)="onPaste($event)"
        />
        <button type="submit" [disabled]="!messageInput.trim()">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
          </svg>
        </button>
      </form>

      <!-- Lightbox -->
      <div *ngIf="lightboxImage()" class="lightbox-overlay" (click)="closeLightbox()">
        <button class="close-lightbox" (click)="closeLightbox()">×</button>
        <img [src]="lightboxImage()" (click)="$event.stopPropagation()" alt="Full size image" />
      </div>
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
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      position: relative;
    }
    @media (max-width: 768px) {
      .chat-container {
        border: none;
        border-radius: 0;
      }
    }

    /* ── Messages ── */
    .messages-list {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: var(--bg-base);
    }
    @media (max-width: 768px) {
      .messages-list { padding: 1rem; }
    }

    .message-wrapper {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .local-wrapper {
      align-items: flex-end;
    }

    /* Remote bubble */
    .message-item {
      max-width: 75%;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      border-bottom-left-radius: 2px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      color: var(--text-primary);
    }

    /* Local bubble */
    .local-message {
      background: var(--accent);
      color: #fff;
      border-color: transparent;
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
    .sender { font-weight: 700; }
    .msg-content {
      font-size: 0.9375rem;
      line-height: 1.4;
      word-break: break-word;
    }

    /* ── Images ── */
    .image-bubble {
      margin-top: 0.5rem;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      max-width: 100%;
    }
    .image-bubble img {
      display: block;
      max-height: 200px;
      max-width: 100%;
      object-fit: cover;
      transition: opacity 0.2s;
    }
    .image-bubble img:hover { opacity: 0.9; }

    /* ── Links ── */
    ::ng-deep .chat-link {
      color: var(--accent);
      text-decoration: underline;
    }
    .local-message ::ng-deep .chat-link {
      color: #fff;
      opacity: 0.85;
    }

    /* ── Input ── */
    .chat-input-form {
      display: flex;
      padding: 1rem;
      background: var(--bg-surface);
      border-top: 1px solid var(--border);
      gap: 0.75rem;
    }
    .chat-input-form input {
      flex: 1;
      padding: 0.625rem 1rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 0.9375rem;
      background: var(--bg-base);
      color: var(--text-primary);
      transition: border-color 0.2s;
    }
    .chat-input-form input::placeholder {
      color: var(--text-muted);
    }
    .chat-input-form input:focus {
      outline: none;
      border-color: var(--accent);
    }
    .chat-input-form button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
      flex-shrink: 0;
    }
    .chat-input-form button:hover:not(:disabled) {
      background: var(--accent-hover);
    }
    .chat-input-form button:disabled {
      background: var(--bg-muted);
      color: var(--text-muted);
      cursor: not-allowed;
    }

    /* ── Lightbox ── */
    .lightbox-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.92);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 2rem;
      animation: fadeIn 0.2s ease-out;
    }
    .lightbox-overlay img {
      max-width: 100%;
      max-height: 100%;
      box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
      border-radius: 4px;
    }
    .close-lightbox {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      background: none;
      border: none;
      color: #fff;
      font-size: 3rem;
      cursor: pointer;
      line-height: 1;
      opacity: 0.8;
      transition: opacity 0.15s;
    }
    .close-lightbox:hover { opacity: 1; }

    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  `]
})
export class ChatComponent implements AfterViewChecked {
  private signalrService = inject(SignalRService);
  private displayNameService = inject(DisplayNameService);

  messages = signal<ChatMessage[]>([]);
  messageInput = '';
  lightboxImage = signal<string | null>(null);

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
      this.messages.set(history.map(msg => ({
        displayName: msg.displayName,
        message: msg.message,
        timestamp: new Date(msg.timestamp),
        isLocal: msg.displayName === currentLocalName
      })));
    });
  }

  ngAfterViewChecked() { this.scrollToBottom(); }

  sendMessage(event: Event) {
    event.preventDefault();
    if (this.messageInput.trim()) {
      this.signalrService.sendChatMessage(this.messageInput.trim());
      this.messageInput = '';
    }
  }

  onPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          if (file.size > 5 * 1024 * 1024) { alert('Image is too large. Max size is 5MB.'); return; }
          const reader = new FileReader();
          reader.onload = (e: any) => this.signalrService.sendChatMessage(e.target.result);
          reader.readAsDataURL(file);
        }
      }
    }
  }

  isImage(message: string): boolean { return message.startsWith('data:image/'); }
  openLightbox(image: string)       { this.lightboxImage.set(image); }
  closeLightbox()                   { this.lightboxImage.set(null); }

  @HostListener('window:keydown.escape')
  onEsc() { this.closeLightbox(); }

  private scrollToBottom(): void {
    try { this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight; }
    catch (err) {}
  }
}