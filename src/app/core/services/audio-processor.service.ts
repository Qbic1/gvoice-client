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
  private localNoiseGate: ScriptProcessorNode | null = null;
  private localAnalyser: AnalyserNode | null = null;

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
        this.updateLocalProcessing(enhancementsEnabled, threshold);
      });
    }
  }

  private updateLocalProcessing(enabled: boolean, threshold: number) {
    if (!this.audioContext) return;

    if (this.localHpFilter) {
      // If enabled, 120Hz highpass, else 0Hz (bypass)
      this.localHpFilter.frequency.setTargetAtTime(enabled ? 120 : 0, this.audioContext.currentTime, 0.1);
    }

    if (this.localCompressor) {
      // If enabled, -50dB threshold and 12 ratio, else 0dB and 1 ratio (bypass)
      this.localCompressor.threshold.setTargetAtTime(enabled ? -50 : 0, this.audioContext.currentTime, 0.1);
      this.localCompressor.ratio.setTargetAtTime(enabled ? 12 : 1, this.audioContext.currentTime, 0.1);
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

    // 1. Analyser for settings UI
    this.localAnalyser = ctx.createAnalyser();
    this.localAnalyser.fftSize = 2048;

    // 2. BiquadFilterNode (highpass, 120Hz)
    this.localHpFilter = ctx.createBiquadFilter();
    this.localHpFilter.type = 'highpass';
    this.localHpFilter.frequency.value = 120;

    // 3. DynamicsCompressorNode
    this.localCompressor = ctx.createDynamicsCompressor();
    this.localCompressor.threshold.setValueAtTime(-50, ctx.currentTime);
    this.localCompressor.knee.setValueAtTime(40, ctx.currentTime);
    this.localCompressor.ratio.setValueAtTime(12, ctx.currentTime);
    this.localCompressor.attack.setValueAtTime(0, ctx.currentTime);
    this.localCompressor.release.setValueAtTime(0.25, ctx.currentTime);

    // 4. Noise Gate (ScriptProcessorNode)
    const bufferSize = 2048;
    this.localNoiseGate = ctx.createScriptProcessor(bufferSize, 1, 1);
    
    this.localNoiseGate.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const output = event.outputBuffer.getChannelData(0);
      
      const enabled = this.settingsService.enableAudioEnhancements();
      const sensitivity = this.settingsService.noiseGateThreshold();

      if (!enabled) {
        output.set(input);
        return;
      }

      let sum = 0;
      for (let i = 0; i < input.length; i++) {
        sum += input[i] * input[i];
      }
      const rms = Math.sqrt(sum / input.length);

      if (rms < sensitivity) {
        output.fill(0);
      } else {
        output.set(input);
      }
    };

    // Connect nodes: Source -> Analyser -> HPF -> Compressor -> Noise Gate -> Destination
    // Note: We always keep the chain connected, but conditionally bypass logic in the noise gate
    // and we could conditionally bypass HPF/Compressor if needed, but the prompt says
    // "enableAudioEnhancements" controls the state.
    
    source.connect(this.localAnalyser);
    
    // We'll use a Gain node as a simple bypass switch for HPF/Compressor if "enabled" is false
    // but for now let's just follow the existing chain and use the flag in the noise gate.
    // If enhancements are OFF, we might still want the highpass? The prompt implies 
    // enableAudioEnhancements toggles the whole "enhancement" logic.
    
    // To properly bypass HPF and Compressor, we'd need to reconnect.
    // For simplicity and to satisfy "reacts to signal changes", 
    // let's just make the noise gate bypassable.
    
    source.connect(this.localHpFilter);
    this.localHpFilter.connect(this.localCompressor);
    this.localCompressor.connect(this.localNoiseGate);
    this.localNoiseGate.connect(destination);

    this.localNodes = [source, this.localAnalyser, this.localHpFilter, this.localCompressor, this.localNoiseGate, destination];

    return destination.stream;
  }

  processRemoteStream(connectionId: string, stream: MediaStream): MediaStream {
    this.cleanupRemote(connectionId);

    const ctx = this.audioContext;
    if (!ctx || stream.getAudioTracks().length === 0) return stream;

    const source = ctx.createMediaStreamSource(stream);
    const destination = ctx.createMediaStreamDestination();

    // High Pass Filter only for remote streams
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
      try {
        node.disconnect();
      } catch (e) {
        // Already disconnected or failed
      }
    });
    this.localNodes = [];
  }

  cleanupRemote(connectionId: string) {
    const nodes = this.remoteNodesMap.get(connectionId);
    if (nodes) {
      nodes.forEach(node => {
        try {
          node.disconnect();
        } catch (e) {
          // Already disconnected or failed
        }
      });
      this.remoteNodesMap.delete(connectionId);
    }
  }
}
