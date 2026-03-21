import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconService } from '../../core/services/icon.service';

@Component({
  selector: 'app-screen-share-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay-backdrop" (click)="close()">
      <div class="overlay-content" (click)="$event.stopPropagation()">
        <video #videoPlayer autoplay muted playsinline [srcObject]="stream"></video>
        <button class="close-btn" (click)="close()">
          <span class="icon" [innerHTML]="icons.CLOSE"></span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .overlay-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      cursor: pointer;
    }
    .overlay-content {
      position: relative;
      background: #000;
      border-radius: 8px;
      padding: 1rem;
      width: 80%;
      height: 80%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      cursor: default;
    }
    video {
      max-width: 100%;
      max-height: 100%;
      border-radius: 4px;
    }
    .close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(0,0,0,0.5);
      color: white;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
    }
    .close-btn:hover {
      background: rgba(0,0,0,0.8);
    }
    .icon {
      display: flex;
    }
  `]
})
export class ScreenShareOverlayComponent {
  icons = inject(IconService);
  
  @Input({ required: true }) stream!: MediaStream;
  @Output() closeOverlay = new EventEmitter<void>();

  close() {
    this.closeOverlay.emit();
  }
}
