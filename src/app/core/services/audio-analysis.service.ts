import { Injectable, inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WebRtcService } from './webrtc.service';
import { ParticipantService } from './participant.service';
import { SignalRService } from './signalr.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, first, switchMap, map, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AudioAnalysisService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private webrtcService = inject(WebRtcService);
  private participantService = inject(ParticipantService);
  private signalrService = inject(SignalRService);

  private audioContext: AudioContext | null = null;
  private analysers = new Map<string, { 
    analyser: AnalyserNode; 
    source: MediaStreamAudioSourceNode; 
    dataArray: any; 
    lastActive: number;
    isSpeaking: boolean;
  }>();
  private SPEAKING_THRESHOLD = 10;
  private HANGOVER_TIME = 300;

  // FIX #4: Track the animation frame ID so we can cancel it on destroy
  private loopId: number | null = null;
  private subscriptions = new Subscription();

  constructor() {
    if (this.isBrowser) {
      const connectionId$ = toObservable(this.signalrService.connectionId).pipe(
        filter((id): id is string => id !== null),
        first()
      );

      // FIX #1: Use switchMap so if localStream$ re-emits, analysis is re-set up correctly
      const localSub = connectionId$.pipe(
        switchMap(id =>
          this.webrtcService.localStream$.pipe(
            map(stream => ({ id, stream }))
          )
        )
      ).subscribe(({ id, stream }) => {
        this.setupAnalysis(id, stream);
      });

      const peerAddedSub = this.webrtcService.peerStreamAdded$.subscribe(data => {
        this.setupAnalysis(data.connectionId, data.stream);
      });

      // FIX #6: Properly disconnect audio nodes when a peer leaves
      const peerLeftSub = this.signalrService.peerLeft$.subscribe(peer => {
        this.teardownAnalysis(peer.connectionId);
      });

      this.subscriptions.add(localSub);
      this.subscriptions.add(peerAddedSub);
      this.subscriptions.add(peerLeftSub);

      // Add global interaction listener to resume AudioContext if it's suspended (autoplay policy)
      const resumeAudio = () => {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('keydown', resumeAudio);
      };
      document.addEventListener('click', resumeAudio);
      document.addEventListener('keydown', resumeAudio);

      this.startLoop();
    }
  }

  private setupAnalysis(connectionId: string, stream: MediaStream): void {
    // FIX #2: Guard check moved to the top, before any side effects
    if (this.analysers.has(connectionId)) {
      // FIX #3: Tear down stale nodes before re-initializing (e.g. on stream replacement)
      this.teardownAnalysis(connectionId);
    }

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    try {
      const source = this.audioContext.createMediaStreamSource(stream);
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // FIX #3: Store source node so it can be disconnected later
      this.analysers.set(connectionId, { analyser, source, dataArray, lastActive: 0, isSpeaking: false });
    } catch (e) {
      console.error(`Failed to set up audio analysis for ${connectionId}`, e);
    }
  }

  // FIX #3 & #6: Centralized cleanup that properly disconnects audio graph nodes
  private teardownAnalysis(connectionId: string): void {
    const entry = this.analysers.get(connectionId);
    if (entry) {
      try {
        entry.source.disconnect();
        entry.analyser.disconnect();
      } catch (e) {
        console.warn(`Failed to disconnect audio nodes for ${connectionId}`, e);
      }
      this.analysers.delete(connectionId);
    }
  }

  private startLoop(): void {
    const loop = () => {
      if (!this.audioContext) {
        this.loopId = requestAnimationFrame(loop);
        return;
      }

      // FIX #5: Skip processing this frame if context is suspended; resume and wait for next frame
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
        this.loopId = requestAnimationFrame(loop);
        return;
      }

      const now = Date.now();
      this.analysers.forEach((data, connectionId) => {
        data.analyser.getByteFrequencyData(data.dataArray);

        let sum = 0;
        for (let i = 0; i < data.dataArray.length; i++) {
          sum += data.dataArray[i];
        }
        const average = data.dataArray.length > 0 ? sum / data.dataArray.length : 0;

        if (average > this.SPEAKING_THRESHOLD) {
          data.lastActive = now;
        }

        const shouldShowSpeaking = (now - data.lastActive) < this.HANGOVER_TIME;
        
        if (data.isSpeaking !== shouldShowSpeaking) {
          data.isSpeaking = shouldShowSpeaking;
          this.participantService.updateSpeakingStatus(connectionId, shouldShowSpeaking);
        }
      });

      this.loopId = requestAnimationFrame(loop);
    };

    this.loopId = requestAnimationFrame(loop);
  }

  // FIX #4: Cancel the loop and clean up all resources on service destroy
  ngOnDestroy(): void {
    if (this.loopId !== null) {
      cancelAnimationFrame(this.loopId);
      this.loopId = null;
    }

    this.analysers.forEach((_, connectionId) => this.teardownAnalysis(connectionId));
    this.analysers.clear();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.subscriptions.unsubscribe();
  }
}
