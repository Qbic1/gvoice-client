import { Component, Input, Output, EventEmitter, inject, ViewChild, ElementRef } from '@angular/core';
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
        
        <div class="overlay-actions">
          <button class="action-btn" (click)="toggleFullscreen()" title="Toggle Fullscreen">
            <span class="icon" [innerHTML]="icons.FULLSCREEN"></span>
          </button>
          <button class="action-btn close-btn" (click)="close()" title="Close">
            <span class="icon" [innerHTML]="icons.CLOSE"></span>
          </button>
        </div>
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
    .overlay-actions {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      gap: 0.5rem;
      z-index: 1010;
    }
    .action-btn {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      backdrop-filter: blur(8px);
    }
    .action-btn:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: scale(1.05);
    }
    .close-btn:hover {
      background: var(--error-500);
      border-color: var(--error-500);
    }
    @media (max-width: 768px) {
      .overlay-actions {
        top: 0.5rem;
        right: 0.5rem;
      }
      .action-btn {
        width: 36px;
        height: 36px;
      }
    }
    .icon {
      display: flex;
    }
    ::ng-deep .icon svg {
      width: 20px;
      height: 20px;
    }
  `]
})
export class ScreenShareOverlayComponent {
  icons = inject(IconService);
  
  @Input({ required: true }) stream!: MediaStream;
  @Output() closeOverlay = new EventEmitter<void>();

  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  toggleFullscreen() {
    const video = this.videoPlayer.nativeElement;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ((video as any).webkitRequestFullscreen) {
      (video as any).webkitRequestFullscreen();
    } else if ((video as any).msRequestFullscreen) {
      (video as any).msRequestFullscreen();
    }
  }

  close() {
    this.closeOverlay.emit();
  }
}
