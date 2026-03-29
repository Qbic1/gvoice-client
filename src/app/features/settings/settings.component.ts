import { Component, inject, signal, HostListener, Output, EventEmitter, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../core/services/settings.service';
import { AudioProcessorService } from '../../core/services/audio-processor.service';
import { SignalRService } from '../../core/services/signalr.service';
import { WebRtcService } from '../../core/services/webrtc.service';
import { ThemeService, THEMES } from '../../core/services/theme.service';

type Tab = 'theme' | 'audio' | 'controls' | 'devices';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class.modal-overlay]="!isInline" (click)="close()">
      <div [class.modal-card]="!isInline" [class.inline-card]="isInline" (click)="$event.stopPropagation()">

        <!-- Header -->
        <header class="modal-header" *ngIf="!isInline">
          <h3>Voice Settings</h3>
          <button class="close-btn" (click)="close()">×</button>
        </header>

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab" [class.active]="activeTab() === 'theme'" (click)="activeTab.set('theme')">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
            Theme
          </button>
          <button class="tab" [class.active]="activeTab() === 'audio'" (click)="switchToAudio()">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            Audio
          </button>
          <button *ngIf="isDesktop && !hideControls" class="tab" [class.active]="activeTab() === 'devices'" (click)="activeTab.set('devices')">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            Devices
          </button>
          <button class="tab" *ngIf="!hideControls" [class.active]="activeTab() === 'controls'" (click)="activeTab.set('controls')">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            Controls
          </button>
        </div>

        <!-- Tab content -->
        <div class="modal-body">

          <!-- ── THEME TAB ── -->
          <div *ngIf="activeTab() === 'theme'">
            <div class="setting-item">
              <div class="theme-group-label">Light</div>
              <div class="theme-grid">
                @for (t of lightThemes; track t.id) {
                  <button
                    class="theme-chip"
                    [class.active]="themeService.theme() === t.id"
                    (click)="themeService.setTheme(t.id)"
                    [title]="t.label"
                  >
                    <span class="chip-swatch">
                      <span class="chip-bg"     [style.background]="t.swatches[0]"></span>
                      <span class="chip-accent" [style.background]="t.swatches[1]"></span>
                    </span>
                    <span class="chip-icon">{{ t.icon }}</span>
                    <span class="chip-label">{{ t.label }}</span>
                  </button>
                }
              </div>
              <div class="theme-group-label dark-group-label">Dark</div>
              <div class="theme-grid">
                @for (t of darkThemes; track t.id) {
                  <button
                    class="theme-chip"
                    [class.active]="themeService.theme() === t.id"
                    (click)="themeService.setTheme(t.id)"
                    [title]="t.label"
                  >
                    <span class="chip-swatch">
                      <span class="chip-bg"     [style.background]="t.swatches[0]"></span>
                      <span class="chip-accent" [style.background]="t.swatches[1]"></span>
                    </span>
                    <span class="chip-icon">{{ t.icon }}</span>
                    <span class="chip-label">{{ t.label }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Current theme preview -->
            <div class="theme-preview">
              <div class="preview-label">Active theme</div>
              <div class="preview-badge">
                <span class="preview-swatch">
                  <span [style.background]="currentTheme().swatches[0]" style="width:50%;height:100%"></span>
                  <span [style.background]="currentTheme().swatches[1]" style="width:50%;height:100%"></span>
                </span>
                {{ currentTheme().icon }} {{ currentTheme().label }}
              </div>
            </div>
          </div>

          <!-- ── AUDIO TAB ── -->
          <div *ngIf="activeTab() === 'audio'">
            <div class="setting-item">
              <div class="setting-label-row">
                <label>Gated Output</label>
                <span class="setting-hint">Post-gate signal</span>
              </div>
              <div class="meter-container">
                <canvas #meterCanvas width="300" height="28" class="meter-canvas"></canvas>
              </div>
              <p class="instruction">Bar drops to zero when gate is closed. Speak to see it open.</p>
            </div>

            <div class="setting-item">
              <div class="threshold-header">
                <label>Noise Gate</label>
                <span class="threshold-value">{{ (noiseGateThreshold() * 100).toFixed(1) }}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.3"
                step="0.005"
                [value]="noiseGateThreshold()"
                (input)="updateThreshold($event)"
              >
              <p class="instruction">
                Raise until background noise (fan, breath) disappears during silence.
                The red line shows the cutoff — bar goes silent below it.
                Works independently of Audio Enhancements.
              </p>
            </div>

            <div class="setting-item">
              <div class="enhancements-row">
                <div class="enhancements-text">
                  <h4>Audio Enhancements</h4>
                  <p>High-pass filter &amp; peak compression. Independent of noise gate.</p>
                </div>
                <button (click)="toggleEnhancements()" class="toggle-btn" [class.on]="enableAudioEnhancements()">
                  <span class="toggle-thumb" [class.on]="enableAudioEnhancements()"></span>
                </button>
              </div>
            </div>
          </div>

          <!-- ── DEVICES TAB ── -->
          <div *ngIf="activeTab() === 'devices'">
            <div class="setting-item">
              <label>Input Device (Microphone)</label>
              <select class="device-select" (change)="onInputDeviceChange($event)">
                <option *ngFor="let device of inputDevices()" 
                        [value]="device.deviceId" 
                        [selected]="device.deviceId === inputDeviceId()">
                  {{ device.label || 'Microphone ' + device.deviceId.slice(0, 5) }}
                </option>
              </select>
              <p class="instruction">Selected: {{ inputDeviceLabel() }}</p>
            </div>

            <div class="setting-item">
              <label>Output Device (Speakers/Headphones)</label>
              <ng-container *ngIf="isSetSinkIdSupported; else notSupported">
                <select class="device-select" (change)="onOutputDeviceChange($event)">
                  <option *ngFor="let device of outputDevices()" 
                          [value]="device.deviceId" 
                          [selected]="device.deviceId === outputDeviceId()">
                    {{ device.label || 'Speaker ' + device.deviceId.slice(0, 5) }}
                  </option>
                </select>
                <p class="instruction">Selected: {{ outputDeviceLabel() }}</p>
              </ng-container>
              <ng-template #notSupported>
                <div class="unsupported-banner">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>Output selection is not supported in this browser.</span>
                </div>
              </ng-template>
            </div>
          </div>

          <!-- ── CONTROLS TAB ── -->
          <div *ngIf="activeTab() === 'controls'">
            <div class="setting-item">
              <div class="setting-label-row">
                <label>Push-to-Talk Key</label>
                <span class="setting-hint">PTT mode only</span>
              </div>
              <div class="rebind-control" [class.recording]="isRecording()" (click)="startRecording()">
                <div class="key-badge">{{ isRecording() ? '...' : pttKey() }}</div>
                <span class="instruction">{{ isRecording() ? 'Press any key — Esc to cancel' : 'Click to rebind' }}</span>
              </div>
            </div>

            <div class="setting-info">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p>Push-to-Talk mode is toggled in the voice controls panel inside the room.</p>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <footer class="modal-footer" *ngIf="!isInline">
          <button class="btn-danger-soft" (click)="reset()">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
            </svg>
            Reset
          </button>
          <button class="btn-primary" (click)="close()">Done</button>
        </footer>

        <!-- Inline footer -->
        <div class="inline-footer" *ngIf="isInline">
          <button class="btn-danger-soft" (click)="reset()">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
            </svg>
            Reset to Default
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.18s ease-out;
    }
    .modal-card {
      background: var(--bg-surface);
      width: 420px;
      max-height: 90dvh;
      border-radius: 20px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .inline-card {
      width: 100%;
      display: flex;
      flex-direction: column;
    }

    /* ── Header ── */
    .modal-header {
      padding: 1.25rem 1.5rem 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: var(--text-primary);
    }
    .close-btn {
      background: var(--bg-muted);
      border: none;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      font-size: 1.2rem;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .close-btn:hover { background: var(--border); color: var(--text-primary); }

    /* ── Tabs ── */
    .tabs {
      display: flex;
      gap: 0.25rem;
      padding: 1rem 1.5rem 0;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .tab {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      border-radius: 6px 6px 0 0;
      transition: all 0.15s;
      font-family: var(--font-family);
    }
    .tab:hover { color: var(--text-secondary); background: var(--bg-muted); }
    .tab.active {
      color: var(--accent);
      border-bottom-color: var(--accent);
      background: var(--accent-subtle);
    }

    /* ── Body ── */
    .modal-body {
      padding: 1.25rem 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    /* ── Spacing ── */
    .setting-item {
      display: flex;
      flex-direction: column;
      margin-bottom: 1.25rem;
    }
    .setting-item:last-child { margin-bottom: 0; }
    .setting-item > label,
    .threshold-header label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }
    .setting-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .setting-label-row label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin: 0;
    }
    .setting-hint { font-size: 0.7rem; color: var(--text-muted); }

    /* ── Theme ── */
    .theme-group-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 0.4rem;
    }
    .dark-group-label { margin-top: 0.75rem; }
    .theme-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.4rem;
    }
    .theme-chip {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
      padding: 0.5rem 0.25rem 0.45rem;
      border-radius: 10px;
      border: 1.5px solid var(--border);
      background: var(--bg-base);
      cursor: pointer;
      transition: all 0.15s;
      color: var(--text-primary);
    }
    .theme-chip:hover { border-color: var(--accent); transform: translateY(-1px); }
    .theme-chip.active {
      border-color: var(--accent);
      background: var(--accent-subtle);
      box-shadow: 0 0 0 2px var(--accent);
    }
    .chip-swatch {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      border: 1.5px solid rgba(0,0,0,0.08);
      flex-shrink: 0;
    }
    .chip-bg     { width: 50%; height: 100%; }
    .chip-accent { width: 50%; height: 100%; }
    .chip-icon   { font-size: 0.75rem; line-height: 1; }
    .chip-label {
      font-size: 0.58rem;
      font-weight: 600;
      text-align: center;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      padding: 0 2px;
    }
    .theme-chip.active .chip-label { color: var(--accent); }

    .theme-preview {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: var(--bg-muted);
      border-radius: 10px;
      border: 1px solid var(--border);
    }
    .preview-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
    }
    .preview-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .preview-swatch {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      border: 1px solid var(--border);
      flex-shrink: 0;
    }

    /* ── Meter ── */
    .meter-container {
      background: var(--bg-muted);
      border-radius: 8px;
      height: 28px;
      overflow: hidden;
    }
    .meter-canvas { width: 100%; height: 100%; display: block; }
    .instruction {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin: 0.375rem 0 0;
      line-height: 1.5;
    }

    /* ── Threshold ── */
    .threshold-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .threshold-header label { margin-bottom: 0; }
    .threshold-value {
      font-size: 0.75rem;
      font-family: monospace;
      font-weight: 700;
      color: var(--accent);
      background: var(--accent-subtle);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }

    /* ── Range ── */
    input[type="range"] {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      appearance: none;
      background: var(--bg-muted);
      outline: none;
      cursor: pointer;
    }
    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0,0,0,0.15);
    }
    input[type="range"]::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
      border: none;
    }

    /* ── Enhancements ── */
    .enhancements-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.875rem 1rem;
      background: var(--bg-muted);
      border-radius: 12px;
      border: 1.5px solid var(--border);
    }
    .enhancements-text { flex: 1; min-width: 0; }
    .enhancements-text h4 {
      margin: 0 0 0.2rem;
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .enhancements-text p {
      margin: 0;
      font-size: 0.7rem;
      color: var(--text-muted);
      line-height: 1.4;
    }
    .toggle-btn {
      position: relative;
      width: 44px;
      height: 24px;
      border-radius: 9999px;
      border: 1.5px solid var(--border);
      background: var(--bg-base);
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
      flex-shrink: 0;
    }
    .toggle-btn.on { background: var(--accent); border-color: var(--accent); }
    .toggle-thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--text-secondary);
      transition: transform 0.2s, background 0.2s;
      box-shadow: var(--shadow-sm);
    }
    .toggle-thumb.on { transform: translateX(20px); background: #fff; }

    /* ── Rebind ── */
    .rebind-control {
      background: var(--bg-base);
      border: 2px dashed var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .rebind-control:hover { border-color: var(--accent); background: var(--accent-subtle); }
    .rebind-control.recording {
      border-color: var(--accent);
      border-style: solid;
      animation: pulse 2s infinite;
    }
    .key-badge {
      display: inline-block;
      background: var(--bg-surface);
      border: 1.5px solid var(--border);
      border-bottom-width: 3px;
      color: var(--text-primary);
      font-size: 1rem;
      font-weight: 800;
      padding: 0.375rem 1rem;
      border-radius: 8px;
      box-shadow: var(--shadow-sm);
      min-width: 80px;
      text-align: center;
    }

    /* ── Devices ── */
    .device-select {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      background: var(--bg-base);
      color: var(--text-primary);
      font-family: var(--font-family);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      outline: none;
      transition: all 0.2s;
    }
    .device-select:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-subtle);
    }
    .unsupported-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: color-mix(in srgb, var(--error-500) 8%, var(--bg-surface));
      border: 1.5px solid color-mix(in srgb, var(--error-500) 25%, transparent);
      border-radius: 12px;
      color: var(--text-secondary);
      font-size: 0.75rem;
      line-height: 1.4;
    }
    .unsupported-banner svg { color: var(--error-500); flex-shrink: 0; }

    /* ── Info ── */
    .setting-info {
      display: flex;
      gap: 0.625rem;
      align-items: flex-start;
      padding: 0.875rem 1rem;
      background: var(--bg-muted);
      border-radius: 12px;
      border: 1px solid var(--border);
      color: var(--text-secondary);
    }
    .setting-info p { margin: 0; font-size: 0.75rem; line-height: 1.5; }

    /* ── Footer ── */
    .modal-footer {
      padding: 1rem 1.5rem;
      background: var(--bg-surface);
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }
    .inline-footer {
      padding: 1rem 0 0;
      display: flex;
      justify-content: center;
    }
    .btn-primary {
      background: var(--accent);
      color: #fff;
      border: none;
      padding: 0.625rem 1.5rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      font-family: var(--font-family);
    }
    .btn-primary:hover { background: var(--accent-hover); transform: translateY(-1px); }
    .btn-danger-soft {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: none;
      border: 1px solid color-mix(in srgb, var(--error-500) 35%, transparent);
      color: var(--error-500);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: var(--font-family);
    }
    .btn-danger-soft:hover {
      background: color-mix(in srgb, var(--error-500) 8%, transparent);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%   { box-shadow: 0 0 0 0    rgba(0,0,0,0.1); }
      70%  { box-shadow: 0 0 0 10px rgba(0,0,0,0);   }
      100% { box-shadow: 0 0 0 0    rgba(0,0,0,0);   }
    }
  `]
})
export class SettingsComponent implements AfterViewInit, OnDestroy, OnInit {
  private settingsService = inject(SettingsService);
  private audioProcessor = inject(AudioProcessorService);
  private signalrService = inject(SignalRService);
  private webrtcService = inject(WebRtcService);
  themeService = inject(ThemeService);

  themes = THEMES;
  lightThemes = THEMES.slice(0, 4);
  darkThemes  = THEMES.slice(4);

  activeTab = signal<Tab>('theme');

  currentTheme() {
    return THEMES.find(t => t.id === this.themeService.theme()) ?? THEMES[0];
  }

  @Input() isInline = false;
  @Input() hideControls = false;
  @Output() onClose = new EventEmitter<void>();
  @ViewChild('meterCanvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  pttKey = this.settingsService.pttKey;
  enableAudioEnhancements = this.settingsService.enableAudioEnhancements;
  noiseGateThreshold = this.settingsService.noiseGateThreshold;
  isRecording = signal(false);

  inputDevices = signal<MediaDeviceInfo[]>([]);
  outputDevices = signal<MediaDeviceInfo[]>([]);
  isSetSinkIdSupported = false;
  isDesktop = false;

  inputDeviceId = this.settingsService.inputDeviceId;
  inputDeviceLabel = this.settingsService.inputDeviceLabel;
  outputDeviceId = this.settingsService.outputDeviceId;
  outputDeviceLabel = this.settingsService.outputDeviceLabel;

  // Must match the max attribute on the range input.
  private readonly METER_MAX = 0.3;

  private animationId: number | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isSetSinkIdSupported = 'setSinkId' in AudioContext.prototype || 'setSinkId' in HTMLAudioElement.prototype;
      this.isDesktop = window.innerWidth >= 1024;
      
      navigator.mediaDevices.addEventListener('devicechange', () => this.enumerateDevices());
    }
  }

  async ngOnInit() {
    if (this.isDesktop) {
      await this.enumerateDevices();
    }
  }

  async enumerateDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.inputDevices.set(devices.filter(d => d.kind === 'audioinput'));
      this.outputDevices.set(devices.filter(d => d.kind === 'audiooutput'));
    } catch (err) {
      console.error('Failed to enumerate devices:', err);
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.startLevelMeter());
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  switchToAudio() {
    this.activeTab.set('audio');
    setTimeout(() => this.startLevelMeter());
  }

  startLevelMeter() {
    if (!this.canvasRef?.nativeElement) return;

    this.analyser = this.audioProcessor.getLocalAnalyser();
    if (!this.analyser) {
      setTimeout(() => this.startLevelMeter(), 500);
      return;
    }
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      if (!this.analyser || !this.dataArray || !this.canvasRef?.nativeElement) return;

      this.analyser.getByteTimeDomainData(this.dataArray);
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        const val = (this.dataArray[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / this.dataArray.length);

      const styles  = getComputedStyle(document.documentElement);
      const bgMuted = styles.getPropertyValue('--bg-muted').trim()  || '#2d1f4e';
      const accent  = styles.getPropertyValue('--accent').trim()    || '#a78bfa';
      const error   = styles.getPropertyValue('--error-500').trim() || '#ef4444';

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = bgMuted;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = Math.min(canvas.width * (rms / this.METER_MAX), canvas.width);
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, barWidth, canvas.height);

      const thresholdPos = Math.min(
        canvas.width * (this.noiseGateThreshold() / this.METER_MAX),
        canvas.width - 1
      );
      ctx.strokeStyle = error;
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

  async onInputDeviceChange(event: any) {
    const id = event.target.value;
    const label = this.inputDevices().find(d => d.deviceId === id)?.label || 'Unknown';
    this.settingsService.saveInputDevice(id, label);
    
    // Trigger re-init of local stream if we are already in a room
    await this.webrtcService.getLocalStream(true);
  }

  async onOutputDeviceChange(event: any) {
    const id = event.target.value;
    const label = this.outputDevices().find(d => d.deviceId === id)?.label || 'Unknown';
    this.settingsService.saveOutputDevice(id, label);
    
    await this.webrtcService.updateOutputDevice(id);
  }

  startRecording() { this.isRecording.set(true); }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (this.isRecording()) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'Escape') { this.isRecording.set(false); return; }
      this.settingsService.savePttKey(event.code);
      this.isRecording.set(false);
    }
  }

  reset() { this.settingsService.resetToDefault(); this.syncSettings(); }
  close() { this.onClose.emit(); }
}
