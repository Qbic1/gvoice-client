import { Component, inject, signal, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <h3>Voice Settings</h3>
          <button class="close-btn" (click)="close()">×</button>
        </header>
        
        <div class="modal-body">
          <div class="setting-item">
            <label>Push-to-Talk Key</label>
            <div class="rebind-control" [class.recording]="isRecording()" (click)="startRecording()">
              <span class="key-label">{{ isRecording() ? 'Press any key...' : pttKey() }}</span>
              <span class="instruction">{{ isRecording() ? 'Esc to cancel' : 'Click to rebind' }}</span>
            </div>
          </div>

          <div class="setting-info">
            <p>Your PTT key is used only when "PTT Mode" is enabled in the voice controls.</p>
          </div>
        </div>

        <footer class="modal-footer">
          <button class="btn-secondary" (click)="reset()">Reset to Default</button>
          <button class="btn-primary" (click)="close()">Done</button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease-out;
    }
    .modal-card {
      background: #fff;
      width: 400px;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f3f4f6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 { margin: 0; font-size: 1.125rem; font-weight: 700; }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #9ca3af;
      cursor: pointer;
      line-height: 1;
    }
    .modal-body {
      padding: 1.5rem;
    }
    .setting-item {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .setting-item label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }
    .rebind-control {
      background: #f9fafb;
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .rebind-control:hover {
      border-color: #000;
      background: #fff;
    }
    .rebind-control.recording {
      border-color: #10b981;
      background: #ecfdf5;
      border-style: solid;
    }
    .key-label {
      font-size: 1.25rem;
      font-weight: 800;
      color: #111827;
    }
    .instruction {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }
    .setting-info {
      margin-top: 1.5rem;
      padding: 0.75rem;
      background: #fefce8;
      border-radius: 8px;
      border: 1px solid #fef08a;
    }
    .setting-info p {
      margin: 0;
      font-size: 0.75rem;
      color: #854d0e;
      line-height: 1.4;
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      background: #f9fafb;
      border-top: 1px solid #f3f4f6;
      display: flex;
      justify-content: space-between;
    }
    .btn-primary {
      background: #000;
      color: #fff;
      border: none;
      padding: 0.5rem 1.25rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-secondary {
      background: none;
      border: 1px solid #d1d5db;
      color: #374151;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class SettingsComponent {
  private settingsService = inject(SettingsService);
  
  @Output() onClose = new EventEmitter<void>();
  
  pttKey = this.settingsService.pttKey;
  isRecording = signal(false);

  startRecording() {
    this.isRecording.set(true);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (this.isRecording()) {
      event.preventDefault();
      event.stopPropagation();
      
      if (event.key === 'Escape') {
        this.isRecording.set(false);
        return;
      }
      
      this.settingsService.savePttKey(event.code);
      this.isRecording.set(false);
    }
  }

  reset() {
    this.settingsService.resetToDefault();
  }

  close() {
    this.onClose.emit();
  }
}
