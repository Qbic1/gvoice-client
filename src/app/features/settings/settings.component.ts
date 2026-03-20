import { Component, inject, signal, HostListener, Output, EventEmitter, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../core/services/settings.service';
import { AudioProcessorService } from '../../core/services/audio-processor.service';
import { SignalRService } from '../../core/services/signalr.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class.modal-overlay]="!isInline" (click)="close()">
      <div [class.modal-card]="!isInline" [class.p-6]="isInline" (click)="$event.stopPropagation()">
        <header class="modal-header" *ngIf="!isInline">
          <h3>Voice Settings</h3>
          <button class="close-btn" (click)="close()">×</button>
        </header>
        
        <div class="modal-body" [class.p-0]="isInline">
          <!-- Audio Level Meter -->
          <div class="setting-item mb-6">
            <label>Input Level</label>
            <div class="meter-container">
              <canvas #meterCanvas width="300" height="24" class="meter-canvas"></canvas>
            </div>
            <p class="instruction">Adjust the noise gate threshold to filter background noise.</p>
          </div>

          <!-- Noise Gate Threshold -->
          <div class="setting-item mb-6">
            <div class="flex justify-between items-center mb-2">
              <label>Noise Gate Threshold</label>
              <span class="text-xs font-mono text-gray-500">{{ (noiseGateThreshold() * 100).toFixed(1) }}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="0.2" 
              step="0.005" 
              [value]="noiseGateThreshold()" 
              (input)="updateThreshold($event)"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
            >
          </div>

          <!-- Audio Enhancements Toggle -->
          <div class="setting-item mb-8">
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <h4 class="text-sm font-bold text-gray-900">Audio Enhancements</h4>
                <p class="text-[10px] text-gray-500 leading-tight">Echo cancellation, noise reduction, and compression.</p>
              </div>
              <button 
                (click)="toggleEnhancements()"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                [class.bg-black]="enableAudioEnhancements()"
                [class.bg-gray-200]="!enableAudioEnhancements()"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  [class.translate-x-6]="enableAudioEnhancements()"
                  [class.translate-x-1]="!enableAudioEnhancements()"
                ></span>
              </button>
            </div>
          </div>

          <!-- Push-to-Talk -->
          <div class="setting-item">
            <label>Push-to-Talk Key</label>
            <div class="rebind-control" [class.recording]="isRecording()" (click)="startRecording()">
              <span class="key-label">{{ isRecording() ? 'Press any key...' : pttKey() }}</span>
              <span class="instruction">{{ isRecording() ? 'Esc to cancel' : 'Click to rebind' }}</span>
            </div>
          </div>

          <div class="setting-info" *ngIf="!isInline">
            <p>Your PTT key is used only when "PTT Mode" is enabled in the voice controls.</p>
          </div>

          <div class="mt-8 flex flex-col gap-4" *ngIf="isInline">
             <button class="btn-secondary w-full py-3" (click)="reset()">Reset to Default</button>
          </div>
        </div>

        <footer class="modal-footer" *ngIf="!isInline">
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
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      overflow: hidden;
    }
    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #f3f4f6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 { margin: 0; font-size: 1.125rem; font-weight: 800; letter-spacing: -0.025em; }
    .close-btn {
      background: #f3f4f6;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      font-size: 1.25rem;
      color: #6b7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .close-btn:hover { background: #e5e7eb; color: #111827; }
    .modal-body {
      padding: 1.5rem;
    }
    .setting-item {
      display: flex;
      flex-direction: column;
    }
    .setting-item label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }
    .meter-container {
      background: #f3f4f6;
      border-radius: 6px;
      height: 24px;
      overflow: hidden;
      position: relative;
    }
    .meter-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
    .rebind-control {
      background: #f9fafb;
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 1.25rem;
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
      border-color: #000;
      background: #f9fafb;
      border-style: solid;
      animation: pulse 2s infinite;
    }
    .key-label {
      font-size: 1rem;
      font-weight: 800;
      color: #111827;
    }
    .instruction {
      font-size: 0.7rem;
      color: #9ca3af;
      margin-top: 0.5rem;
    }
    .setting-info {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
    }
    .setting-info p {
      margin: 0;
      font-size: 0.75rem;
      color: #64748b;
      line-height: 1.5;
    }
    .modal-footer {
      padding: 1.25rem 1.5rem;
      background: #fff;
      border-top: 1px solid #f3f4f6;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    .btn-primary {
      background: #000;
      color: #fff;
      border: none;
      padding: 0.625rem 1.5rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-secondary {
      background: #fff;
      border: 1px solid #e5e7eb;
      color: #374151;
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-secondary:hover { background: #f9fafb; border-color: #d1d5db; }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(0,0,0,0.1); }
      70% { box-shadow: 0 0 0 10px rgba(0,0,0,0); }
      100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
    }
  `]
})
export class SettingsComponent implements AfterViewInit, OnDestroy {
  private settingsService = inject(SettingsService);
  private audioProcessor = inject(AudioProcessorService);
  private signalrService = inject(SignalRService);
  
  @Input() isInline = false;
  @Output() onClose = new EventEmitter<void>();
  @ViewChild('meterCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  pttKey = this.settingsService.pttKey;
  enableAudioEnhancements = this.settingsService.enableAudioEnhancements;
  noiseGateThreshold = this.settingsService.noiseGateThreshold;
  isRecording = signal(false);

  private animationId: number | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;

  ngAfterViewInit() {
    this.startLevelMeter();
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  startLevelMeter() {
    this.analyser = this.audioProcessor.getLocalAnalyser();
    if (!this.analyser) {
      // Retry in a bit if analyser isn't ready (e.g. stream not started)
      setTimeout(() => this.startLevelMeter(), 500);
      return;
    }

    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      if (!this.analyser || !this.dataArray) return;

      this.analyser.getByteTimeDomainData(this.dataArray);

      // Calculate RMS
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        const val = (this.dataArray[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / this.dataArray.length);
      
      // Draw background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw level
      const width = canvas.width * (rms * 5); // Multiplier to make it more visible
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#000');
      gradient.addColorStop(1, '#4b5563');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, Math.min(width, canvas.width), canvas.height);

      // Draw threshold line
      const thresholdPos = canvas.width * (this.noiseGateThreshold() * 5);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(thresholdPos, 0);
      ctx.lineTo(thresholdPos, canvas.height);
      ctx.stroke();
    };

    draw();
  }

  updateThreshold(event: any) {
    const val = parseFloat(event.target.value);
    this.settingsService.updateAudioSettings(this.enableAudioEnhancements(), val);
    this.syncSettings();
  }

  toggleEnhancements() {
    const newVal = !this.enableAudioEnhancements();
    this.settingsService.updateAudioSettings(newVal, this.noiseGateThreshold());
    this.syncSettings();
  }

  private syncSettings() {
    this.signalrService.updateAudioSettings({
      enableAudioEnhancements: this.enableAudioEnhancements(),
      noiseGateThreshold: this.noiseGateThreshold()
    });
  }

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
    this.syncSettings();
  }

  close() {
    this.onClose.emit();
  }
}
