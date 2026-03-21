import { Injectable, inject, PLATFORM_ID, effect } from '@angular/core';
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

  // Specific nodes for real-time adjustment
  private localHpFilter: BiquadFilterNode | null = null;
  private localCompressor: DynamicsCompressorNode | null = null;
  private localNoiseGate: AudioWorkletNode | null = null;
  private localAnalyser: AnalyserNode | null = null;

  private workletReady = false;

  get audioContext(): AudioContext | null {
    if (!this._audioContext && this.isBrowser) {
      this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.loadWorklets();
    }
    return this._audioContext;
  }

  constructor() {
    if (this.isBrowser) {
      effect(() => {
        const enhancementsEnabled = this.settingsService.enableAudioEnhancements();
        const threshold = this.settingsService.noiseGateThreshold();
        this.updateLocalProcessing(enhancementsEnabled, threshold);
      });
    }
  }

  private async loadWorklets() {
    if (!this._audioContext || this.workletReady) return;
    try {
      await this._audioContext.audioWorklet.addModule('assets/audio-worklet.js');
      this.workletReady = true;
      console.log('AudioWorklets loaded successfully');
    } catch (e) {
      console.error('Failed to load AudioWorklets:', e);
    }
  }

  private updateLocalProcessing(enabled: boolean, threshold: number) {
    const ctx = this.audioContext;
    if (!ctx) return;

    if (this.localHpFilter) {
      this.localHpFilter.frequency.setTargetAtTime(enabled ? 120 : 10, ctx.currentTime, 0.1);
    }

    if (this.localCompressor) {
      this.localCompressor.threshold.setTargetAtTime(enabled ? -50 : 0, ctx.currentTime, 0.1);
      this.localCompressor.ratio.setTargetAtTime(enabled ? 12 : 1, ctx.currentTime, 0.1);
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

    // 1. Analyser
    this.localAnalyser = ctx.createAnalyser();
    this.localAnalyser.fftSize = 2048;

    // 2. High Pass Filter
    this.localHpFilter = ctx.createBiquadFilter();
    this.localHpFilter.type = 'highpass';
    this.localHpFilter.frequency.value = this.settingsService.enableAudioEnhancements() ? 120 : 10;

    // 3. Compressor
    this.localCompressor = ctx.createDynamicsCompressor();
    const enabled = this.settingsService.enableAudioEnhancements();
    this.localCompressor.threshold.setValueAtTime(enabled ? -50 : 0, ctx.currentTime);
    this.localCompressor.ratio.setValueAtTime(enabled ? 12 : 1, ctx.currentTime);
    this.localCompressor.knee.setValueAtTime(40, ctx.currentTime);
    this.localCompressor.attack.setValueAtTime(0, ctx.currentTime);
    this.localCompressor.release.setValueAtTime(0.25, ctx.currentTime);

    // 4. Noise Gate (using AudioWorklet if ready, fallback to bypass)
    source.connect(this.localAnalyser);
    source.connect(this.localHpFilter);
    this.localHpFilter.connect(this.localCompressor);

    if (this.workletReady) {
      this.localNoiseGate = new AudioWorkletNode(ctx, 'noise-gate-processor');
      this.updateLocalProcessing(this.settingsService.enableAudioEnhancements(), this.settingsService.noiseGateThreshold());
      
      this.localCompressor.connect(this.localNoiseGate);
      this.localNoiseGate.connect(destination);
      this.localNodes = [source, this.localAnalyser, this.localHpFilter, this.localCompressor, this.localNoiseGate, destination];
    } else {
      this.localCompressor.connect(destination);
      this.localNodes = [source, this.localAnalyser, this.localHpFilter, this.localCompressor, destination];
    }

    return destination.stream;
  }

  processRemoteStream(connectionId: string, stream: MediaStream): MediaStream {
    this.cleanupRemote(connectionId);

    const ctx = this.audioContext;
    if (!ctx || stream.getAudioTracks().length === 0) return stream;

    const source = ctx.createMediaStreamSource(stream);
    const destination = ctx.createMediaStreamDestination();

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 120;

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
