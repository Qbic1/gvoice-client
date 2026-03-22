import { Injectable, inject, PLATFORM_ID, effect, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class AudioProcessorService {
  private platformId = inject(PLATFORM_ID);
  private settingsService = inject(SettingsService);
  private isBrowser = isPlatformBrowser(this.platformId);

  private _audioContext: AudioContext | null = null;
  private localNodes: AudioNode[] = [];
  private remoteNodesMap = new Map<string, AudioNode[]>();

  private localHpFilter: BiquadFilterNode | null = null;
  private localCompressor: DynamicsCompressorNode | null = null;
  private localNoiseGate: AudioWorkletNode | null = null;
  private localAnalyser: AnalyserNode | null = null;

  private workletReady = signal(false);
  private onProcessedStreamReady: ((stream: MediaStream) => void) | null = null;

  get audioContext(): AudioContext | null {
    if (!this._audioContext && this.isBrowser) {
      this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this._audioContext;
  }

  constructor() {
    if (this.isBrowser) {
      effect(() => {
        const enhancementsEnabled = this.settingsService.enableAudioEnhancements();
        const threshold = this.settingsService.noiseGateThreshold();
        this.workletReady();
        this.updateLocalProcessing(enhancementsEnabled, threshold);
      });
    }
  }

  async ensureWorkletLoaded(): Promise<boolean> {
    const ctx = this.audioContext;
    if (!ctx || this.workletReady()) return false;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    try {
      await ctx.audioWorklet.addModule('assets/audio-worklet.js');
      this.workletReady.set(true);
      console.log('AudioWorklets loaded successfully');
      return true;
    } catch (e) {
      console.error('Failed to load AudioWorklets:', e);
      return false;
    }
  }

  registerStreamReadyCallback(cb: (stream: MediaStream) => void) {
    this.onProcessedStreamReady = cb;
  }

  private updateLocalProcessing(enabled: boolean, threshold: number) {
    const ctx = this.audioContext;
    if (!ctx) return;

    if (this.localHpFilter) {
      // High-pass: cut rumble when enabled, pass everything when disabled
      this.localHpFilter.frequency.setTargetAtTime(enabled ? 80 : 10, ctx.currentTime, 0.1);
    }

    if (this.localCompressor) {
      if (enabled) {
        // FIX: Use a gentle output limiter, NOT an expander/noise pump.
        // threshold: -12dB — only bricks peaks above a comfortable level
        // ratio: 4:1    — gentle, transparent, won't push up the noise floor
        // attack: 5ms   — avoids distortion on transients
        // release: 200ms — natural decay
        this.localCompressor.threshold.setTargetAtTime(-12, ctx.currentTime, 0.1);
        this.localCompressor.ratio.setTargetAtTime(4, ctx.currentTime, 0.1);
        this.localCompressor.attack.setTargetAtTime(0.005, ctx.currentTime, 0.1);
        this.localCompressor.release.setTargetAtTime(0.2, ctx.currentTime, 0.1);
      } else {
        // Disabled: set to unity (no compression)
        this.localCompressor.threshold.setTargetAtTime(0, ctx.currentTime, 0.1);
        this.localCompressor.ratio.setTargetAtTime(1, ctx.currentTime, 0.1);
        this.localCompressor.attack.setTargetAtTime(0.003, ctx.currentTime, 0.1);
        this.localCompressor.release.setTargetAtTime(0.25, ctx.currentTime, 0.1);
      }
    }

    if (this.localNoiseGate) {
      const thresholdParam = this.localNoiseGate.parameters.get('threshold');
      const enabledParam = this.localNoiseGate.parameters.get('enabled');
      if (thresholdParam) thresholdParam.setTargetAtTime(threshold, ctx.currentTime, 0.1);
      if (enabledParam) enabledParam.setTargetAtTime(enabled ? 1 : 0, ctx.currentTime, 0.1);
    }
  }

  getLocalAnalyser(): AnalyserNode | null {
    return this.localAnalyser;
  }

  processLocalStream(stream: MediaStream): MediaStream {
    this.cleanupLocal();

    const ctx = this.audioContext;
    if (!ctx || stream.getAudioTracks().length === 0) return stream;

    const source = ctx.createMediaStreamSource(stream);
    const destination = ctx.createMediaStreamDestination();

    // 1. Analyser — tapped off the source for the settings level meter.
    //    NOT in the processing chain, so it always shows raw mic level.
    this.localAnalyser = ctx.createAnalyser();
    this.localAnalyser.fftSize = 2048;
    source.connect(this.localAnalyser);

    // 2. High Pass Filter — removes low-frequency rumble (mic handling noise, HVAC)
    this.localHpFilter = ctx.createBiquadFilter();
    this.localHpFilter.type = 'highpass';
    const enabled = this.settingsService.enableAudioEnhancements();
    this.localHpFilter.frequency.value = enabled ? 80 : 10;
    this.localHpFilter.Q.value = 0.7; // Butterworth — flat passband, no resonance peak

    // 3. Compressor — gentle peak limiter only, does NOT amplify noise floor.
    //    FIX: previous values (-50dB threshold, 12:1 ratio, 0ms attack) were
    //    compressing the entire dynamic range and pumping quiet noise upward.
    this.localCompressor = ctx.createDynamicsCompressor();
    this.localCompressor.knee.setValueAtTime(6, ctx.currentTime);     // soft knee for transparency
    if (enabled) {
      this.localCompressor.threshold.setValueAtTime(-12, ctx.currentTime);
      this.localCompressor.ratio.setValueAtTime(4, ctx.currentTime);
      this.localCompressor.attack.setValueAtTime(0.005, ctx.currentTime);
      this.localCompressor.release.setValueAtTime(0.2, ctx.currentTime);
    } else {
      // Unity passthrough when disabled
      this.localCompressor.threshold.setValueAtTime(0, ctx.currentTime);
      this.localCompressor.ratio.setValueAtTime(1, ctx.currentTime);
      this.localCompressor.attack.setValueAtTime(0.003, ctx.currentTime);
      this.localCompressor.release.setValueAtTime(0.25, ctx.currentTime);
    }

    // Wire: source → HPF → compressor
    source.connect(this.localHpFilter);
    this.localHpFilter.connect(this.localCompressor);

    if (this.workletReady()) {
      // 4. Noise Gate (worklet) — silences signal below threshold entirely
      this.localNoiseGate = new AudioWorkletNode(ctx, 'noise-gate-processor');

      this.updateLocalProcessing(
        this.settingsService.enableAudioEnhancements(),
        this.settingsService.noiseGateThreshold()
      );

      // Wire: compressor → noiseGate → destination
      this.localCompressor.connect(this.localNoiseGate);
      this.localNoiseGate.connect(destination);
      this.localNodes = [source, this.localAnalyser, this.localHpFilter, this.localCompressor, this.localNoiseGate, destination];
    } else {
      this.localCompressor.connect(destination);
      this.localNodes = [source, this.localAnalyser, this.localHpFilter, this.localCompressor, destination];
      console.warn('AudioWorklet not ready — noise gate bypassed.');
    }

    return destination.stream;
  }

  rebuildLocalGraph(rawStream: MediaStream): MediaStream {
    const upgraded = this.processLocalStream(rawStream);
    this.onProcessedStreamReady?.(upgraded);
    return upgraded;
  }

  processRemoteStream(connectionId: string, stream: MediaStream): MediaStream {
    this.cleanupRemote(connectionId);

    const ctx = this.audioContext;
    if (!ctx || stream.getAudioTracks().length === 0) return stream;

    const source = ctx.createMediaStreamSource(stream);
    const destination = ctx.createMediaStreamDestination();

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 80;
    hpFilter.Q.value = 0.7;

    source.connect(hpFilter);
    hpFilter.connect(destination);

    this.remoteNodesMap.set(connectionId, [source, hpFilter, destination]);

    return destination.stream;
  }

  cleanupLocal() {
    this.localNodes.forEach(node => {
      try { node.disconnect(); } catch (e) {}
    });
    this.localNodes = [];
    this.localHpFilter = null;
    this.localCompressor = null;
    this.localNoiseGate = null;
  }

  cleanupRemote(connectionId: string) {
    const nodes = this.remoteNodesMap.get(connectionId);
    if (nodes) {
      nodes.forEach(node => {
        try { node.disconnect(); } catch (e) {}
      });
      this.remoteNodesMap.delete(connectionId);
    }
  }
}