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
      display: block;
    }
    .overlay-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(12px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      cursor: pointer;
    }
    @media (max-width: 768px) {
      .overlay-backdrop {
        padding: 0;
      }
    }
    .overlay-content {
      position: relative;
      background: #000;
      border-radius: 12px;
      width: 100%;
      height: 100%;
      max-width: 1280px;
      max-height: 720px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      cursor: default;
      overflow: hidden;
    }
    @media (max-width: 768px) {
      .overlay-content {
        border-radius: 0;
        border: none;
      }
    }
    @media (max-aspect-ratio: 16/9) {
      .overlay-content {
        height: auto;
        aspect-ratio: 16/9;
      }
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      border-radius: 8px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      backdrop-filter: blur(8px);
      z-index: 1010;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    @media (max-width: 768px) {
      .close-btn {
        top: 0.5rem;
        right: 0.5rem;
        width: 36px;
        height: 36px;
      }
    }
    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
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
