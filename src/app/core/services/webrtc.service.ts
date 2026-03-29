import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SignalRService } from './signalr.service';
import { ParticipantService } from './participant.service';
import { SettingsService } from './settings.service';
import { AudioProcessorService } from './audio-processor.service';
import { ChimesService } from './chimes.service';
import { Subject, ReplaySubject, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class WebRtcService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private signalrService = inject(SignalRService);
  private participantService = inject(ParticipantService);
  private settingsService = inject(SettingsService);
  private audioProcessorService = inject(AudioProcessorService);
  private chimesService = inject(ChimesService);

  private peerConnections = new Map<string, RTCPeerConnection>();
  private pendingConnections = new Map<string, Promise<RTCPeerConnection>>();
  private localStream: MediaStream | null = null;
  private localProcessedStream: MediaStream | null = null;
  private remoteStreams = new Map<string, MediaStream>();

  public get audioContext(): AudioContext | null {
    return this.audioProcessorService.audioContext;
  }
  private participantGainNodes = new Map<string, GainNode>();
  private participantSourceNodes = new Map<string, MediaStreamAudioSourceNode>();
  private audioElements = new Map<string, HTMLAudioElement>();

  public localStream$ = new ReplaySubject<MediaStream>(1);
  public screenStream$ = new ReplaySubject<MediaStream | null>(1);
  public peerStreamAdded$ = new Subject<{ connectionId: string, stream: MediaStream }>();
  public currentStreamToWatch = signal<MediaStream | null>(null);

  isMuted = signal(false);
  isPttMode = signal(false);
  isPttActive = signal(false);
  isDeafened = signal(false);
  isSharingScreen = signal(false);
  private lastMuteStateBeforePtt = false;

  private screenStream: MediaStream | null = null;
  private screenSenders = new Map<string, RTCRtpSender[]>();

  // Perfect Negotiation state
  private makingOffer = new Map<string, boolean>();
  private ignoreOffer = new Map<string, boolean>();
  private iceCandidatesQueue = new Map<string, RTCIceCandidateInit[]>();

  private iceServers: RTCConfiguration = {
    iceServers: environment.iceServers,
    iceCandidatePoolSize: 10
  };

  constructor() {
    this.audioProcessorService.registerStreamReadyCallback((upgradedStream) => {
      this.localProcessedStream = upgradedStream;
      this.replaceTracksInAllPeerConnections(upgradedStream);
    });

    this.signalrService.peerJoined$.subscribe(async (peer) => {
      await this.getLocalStream();
      await this.getOrCreatePeerConnection(peer.connectionId, true);
    });

    this.signalrService.receiveSignal$.subscribe(async (data) => {
      await this.handleSignal(data.fromConnectionId, data.signal);
    });

    this.signalrService.peerLeft$.subscribe((peer) => {
      this.closePeerConnection(peer.connectionId);
    });

    this.signalrService.peerStateUpdated$.subscribe((data) => {
      if (data.stateType === 'sharingScreen') {
        if (data.value) {
          this.chimesService.playScreenShareStart();
        } else {
          this.chimesService.playScreenShareStop();

          // If we were watching this peer's stream, close the overlay
          const currentStream = this.currentStreamToWatch();
          if (currentStream) {
            const peerStream = this.remoteStreams.get(data.connectionId);
            if (peerStream === currentStream) {
              this.closeStream();
            }
          }
        }
      }
    });

    // Global interaction listener to resume AudioContext (autoplay policy)
    if (this.isBrowser) {
      const resumeAudio = () => {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
      };
      document.addEventListener('click', resumeAudio);
      document.addEventListener('keydown', resumeAudio);
    }
  }

  private initAudioContext() {
    const ctx = this.audioContext;
  }

  async getLocalStream(forceReinit = false): Promise<MediaStream | null> {
    if (!this.isBrowser) return null;
    
    if (this.localStream && !forceReinit) return this.localStream;

    if (forceReinit && this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }

    this.initAudioContext();
    try {
      const inputId = this.settingsService.inputDeviceId();
      const audioConstraints: any = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false, // let our compressor handle this
        sampleRate: 48000,
        channelCount: 1,        // mono — halves worklet processing load
      };

      if (inputId && inputId !== 'default') {
        audioConstraints.deviceId = { exact: inputId };
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false
      });

      // Load worklet AFTER getUserMedia so AudioContext is guaranteed not suspended
      await this.audioProcessorService.ensureWorkletLoaded();

      this.localProcessedStream = this.audioProcessorService.processLocalStream(this.localStream);

      this.localStream$.next(this.localStream);

      if (this.isPttMode()) {
        this.setMicEnabled(false);
      } else {
        this.isMuted.set(!this.localStream.getAudioTracks()[0].enabled);
      }

      return this.localStream;
    } catch (err) {
      console.error('Error getting local stream:', err);
      return null;
    }
  }

  async updateOutputDevice(deviceId: string) {
    if (!this.isBrowser) return;

    const outputId = deviceId === 'default' ? '' : deviceId;

    // Apply to AudioContext
    if (this.audioContext && 'setSinkId' in this.audioContext) {
      try {
        await (this.audioContext as any).setSinkId(outputId);
      } catch (err) {
        console.error('Failed to set sink ID on AudioContext:', err);
      }
    }

    // Apply to all active remote audio elements
    for (const audio of this.audioElements.values()) {
      if ('setSinkId' in audio) {
        try {
          await (audio as any).setSinkId(outputId);
        } catch (err) {
          console.error('Failed to set sink ID on audio element:', err);
        }
      }
    }
  }

  private replaceTracksInAllPeerConnections(processedStream: MediaStream) {
    const newTrack = processedStream.getAudioTracks()[0];
    if (!newTrack) return;

    this.peerConnections.forEach((pc, connectionId) => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
      if (sender) {
        sender.replaceTrack(newTrack).catch(err => {
          console.error(`Failed to replace track for peer ${connectionId}:`, err);
        });
      }
    });
  }

  toggleMute() {
    if (this.isPttMode()) return;

    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        this.setMicEnabled(!audioTrack.enabled);
      }
    }
  }

  togglePttMode() {
    const newPttState = !this.isPttMode();
    this.isPttMode.set(newPttState);

    if (newPttState) {
      this.lastMuteStateBeforePtt = this.isMuted();
      this.setMicEnabled(false);
    } else {
      this.setMicEnabled(!this.lastMuteStateBeforePtt);
    }
  }

  toggleDeafen() {
    const newState = !this.isDeafened();
    this.isDeafened.set(newState);
    this.signalrService.updateState('deafened', newState);

    if (newState) {
      this.lastMuteStateBeforePtt = this.isMuted();
      this.setMicEnabled(false);
    } else {
      if (!this.isPttMode()) {
        this.setMicEnabled(!this.lastMuteStateBeforePtt);
      }
    }

    this.participantGainNodes.forEach((_, connectionId) => {
      this.applyParticipantVolume(connectionId);
    });
  }

  setPttActive(active: boolean) {
    if (!this.isPttMode()) return;
    this.isPttActive.set(active);
    this.setMicEnabled(active);
  }

  getStream(connectionId: string): MediaStream | undefined {
    return this.remoteStreams.get(connectionId);
  }

  watchStream(connectionId: string) {
    const stream = this.getStream(connectionId);
    if (stream) {
      this.currentStreamToWatch.set(stream);
    }
  }

  closeStream() {
    this.currentStreamToWatch.set(null);
  }

  setParticipantVolume(connectionId: string, volume: number) {
    this.participantService.updateParticipantVolume(connectionId, volume);
    this.applyParticipantVolume(connectionId);
  }

  private applyParticipantVolume(connectionId: string) {
    const gainNode = this.participantGainNodes.get(connectionId);
    if (!gainNode || !this.audioContext) return;

    const participant = this.participantService.participants().find(p => p.connectionId === connectionId);
    const volumePercent = participant?.volume ?? 100;
    const gainValue = this.isDeafened() ? 0 : (volumePercent / 100);

    gainNode.gain.setTargetAtTime(gainValue, this.audioContext.currentTime, 0.01);
  }

  private setMicEnabled(enabled: boolean) {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
        this.isMuted.set(!enabled);
        this.signalrService.updateState('muted', !enabled);
      }
    }
  }

  private async createPeerConnection(connectionId: string, isOfferor: boolean): Promise<RTCPeerConnection> {
    const stream = this.localStream ?? await this.getLocalStream();

    const pc = new RTCPeerConnection(this.iceServers);
    this.peerConnections.set(connectionId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalrService.sendSignal(connectionId, JSON.stringify({ ice: event.candidate }));
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer.set(connectionId, true);
        const offer = await pc.createOffer();
        // If the signaling state changed while we were creating the offer, abort
        if (pc.signalingState !== 'stable') return;

        await pc.setLocalDescription(offer);
        this.signalrService.sendSignal(connectionId, JSON.stringify({ sdp: pc.localDescription }));
      } catch (err) {
        console.error('Renegotiation failed:', err);
      } finally {
        this.makingOffer.set(connectionId, false);
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      this.remoteStreams.set(connectionId, stream);
      this.peerStreamAdded$.next({ connectionId, stream });
      this.playRemoteStream(connectionId, stream);
    };

    const tracksStream = this.localProcessedStream ?? stream;
    if (tracksStream) {
      tracksStream.getTracks().forEach(track => pc.addTrack(track, tracksStream));
    }

    // Add screen tracks if sharing
    if (this.isSharingScreen() && this.screenStream) {
      this.addScreenTracksToPeer(connectionId, pc);
    }

    // REMOVED: isOfferor check here. onnegotiationneeded will handle initial offer.
    // This avoids double-offering when tracks are added.

    return pc;
  }

  async startScreenShare() {
    if (!this.isBrowser || this.isSharingScreen()) return;

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: 30,
          height: 720
        },
        audio: true
      });

      this.isSharingScreen.set(true);
      this.screenStream$.next(this.screenStream);
      this.signalrService.updateState('sharingScreen', true);

      this.chimesService.playScreenShareStart();
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Add tracks to all existing peer connections
      this.peerConnections.forEach((pc, connectionId) => {
        this.addScreenTracksToPeer(connectionId, pc);
      });

      // Handle "Stop Sharing" from browser UI
      this.screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

    } catch (err) {
      console.error('Error starting screen share:', err);
      this.isSharingScreen.set(false);
      this.screenStream$.next(null);
    }
  }

  stopScreenShare() {
    if (!this.screenStream) return;

    this.screenStream.getTracks().forEach(track => track.stop());

    // Remove tracks from all peer connections
    this.peerConnections.forEach((pc, connectionId) => {
      this.removeScreenTracksFromPeer(connectionId, pc);
    });

    this.screenStream = null;
    this.isSharingScreen.set(false);
    this.screenStream$.next(null);
    this.signalrService.updateState('sharingScreen', false);

    this.chimesService.playScreenShareStop();
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 30]);
    }
  }

  private addScreenTracksToPeer(connectionId: string, pc: RTCPeerConnection) {
    if (!this.screenStream) return;

    const senders: RTCRtpSender[] = [];
    this.screenStream.getTracks().forEach(track => {
      const sender = pc.addTrack(track, this.screenStream!);
      senders.push(sender);
    });
    this.screenSenders.set(connectionId, senders);
  }

  private removeScreenTracksFromPeer(connectionId: string, pc: RTCPeerConnection) {
    const senders = this.screenSenders.get(connectionId);
    if (senders) {
      senders.forEach(sender => {
        try {
          pc.removeTrack(sender);
        } catch (err) {
          console.warn('Error removing track from peer:', connectionId, err);
        }
      });
      this.screenSenders.delete(connectionId);
    }
  }

  private getOrCreatePeerConnection(connectionId: string, isOfferor: boolean): Promise<RTCPeerConnection> {
    const existing = this.peerConnections.get(connectionId);
    if (existing) return Promise.resolve(existing);

    const pending = this.pendingConnections.get(connectionId);
    if (pending) return pending;

    const promise = this.createPeerConnection(connectionId, isOfferor)
      .finally(() => this.pendingConnections.delete(connectionId));

    this.pendingConnections.set(connectionId, promise);
    return promise;
  }

  private async handleSignal(connectionId: string, signal: string) {
    const data = JSON.parse(signal);
    const pc = await this.getOrCreatePeerConnection(connectionId, false);

    try {
      if (data.sdp) {
        const description = new RTCSessionDescription(data.sdp);
        const offerCollision = description.type === 'offer' &&
          (this.makingOffer.get(connectionId) || pc.signalingState !== 'stable');

        this.ignoreOffer.set(connectionId, offerCollision && !this.isPolite(connectionId));
        if (this.ignoreOffer.get(connectionId)) {
          console.log(`[WebRTC] Ignoring colliding offer from ${connectionId} (impolite)`);
          return;
        }

        await pc.setRemoteDescription(description);

        // Process queued ICE candidates
        const queue = this.iceCandidatesQueue.get(connectionId);
        if (queue) {
          console.log(`[WebRTC] Processing ${queue.length} queued ICE candidates for ${connectionId}`);
          for (const candidate of queue) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          this.iceCandidatesQueue.delete(connectionId);
        }

        if (description.type === 'offer') {
          await pc.setLocalDescription();
          this.signalrService.sendSignal(connectionId, JSON.stringify({ sdp: pc.localDescription }));
        }
      } else if (data.ice) {
        try {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(data.ice));
          } else {
            // Queue candidate if remote description not yet set
            const queue = this.iceCandidatesQueue.get(connectionId) || [];
            queue.push(data.ice);
            this.iceCandidatesQueue.set(connectionId, queue);
          }
        } catch (err) {
          if (!this.ignoreOffer.get(connectionId)) {
            throw err;
          }
        }
      }
    } catch (err) {
      console.error(`Error handling signal from peer ${connectionId}:`, err);
    }
  }

  // Polite peer is the one who didn't initiate the connection (the receiver)
  // In our mesh, we use lexicographical comparison of connection IDs for a stable result.
  private isPolite(connectionId: string): boolean {
    const localId = this.signalrService.connectionId();
    if (!localId) return true;
    return localId < connectionId;
  }

  private closePeerConnection(connectionId: string) {
    this.pendingConnections.delete(connectionId);
    const pc = this.peerConnections.get(connectionId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(connectionId);
      this.remoteStreams.delete(connectionId);

      const source = this.participantSourceNodes.get(connectionId);
      if (source) {
        source.disconnect();
        this.participantSourceNodes.delete(connectionId);
      }

      const gain = this.participantGainNodes.get(connectionId);
      if (gain) {
        gain.disconnect();
        this.participantGainNodes.delete(connectionId);
      }

      const audio = this.audioElements.get(connectionId);
      if (audio) {
        audio.pause();
        audio.srcObject = null;
        this.audioElements.delete(connectionId);
      }

      this.audioProcessorService.cleanupRemote(connectionId);
    }
  }

  private startVADWorklet(connectionId: string, stream: MediaStream) {
    if (!this.audioContext) return;

    try {
      const source = this.audioContext.createMediaStreamSource(stream);
      const vadNode = new AudioWorkletNode(this.audioContext, 'vad-processor');

      source.connect(vadNode);

      vadNode.port.onmessage = (event) => {
        const speaking = !!event.data;
        this.participantService.updateSpeakingStatus(connectionId, speaking);
      };

      // store to prevent GC
      this.participantSourceNodes.set(connectionId, source);

    } catch (err) {
      console.error('VAD worklet failed:', err);
    }
  }

  private playRemoteStream(connectionId: string, stream: MediaStream) {
    if (!this.isBrowser) return;
    this.initAudioContext();

    if (this.audioContext && stream.getAudioTracks().length > 0) {
      const processedStream = this.audioProcessorService.processRemoteStream(connectionId, stream);

      try {
        const source = this.audioContext.createMediaStreamSource(processedStream);
        const gainNode = this.audioContext.createGain();

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        this.participantSourceNodes.set(connectionId, source);
        this.participantGainNodes.set(connectionId, gainNode);

        this.applyParticipantVolume(connectionId);
        this.startVADWorklet(connectionId, processedStream);

        if (this.audioContext.state === 'suspended') {
          const resume = () => {
            this.audioContext?.resume();
            document.removeEventListener('click', resume);
          };
          document.addEventListener('click', resume);
        }
      } catch (err) {
        console.error('Failed to set up GainNode for peer:', connectionId, err);
      }
    }

    // Still create audio element for video streams, but only if they have audio
    if (stream.getAudioTracks().length > 0) {
      let audio = this.audioElements.get(connectionId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.muted = true;
        audio.style.display = 'none';
        document.body.appendChild(audio);
        this.audioElements.set(connectionId, audio);
      }

      audio.srcObject = stream;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          if (err.name === 'NotAllowedError') {
            console.warn('Autoplay blocked for peer:', connectionId);
            const resumeAudio = () => {
              this.audioElements.forEach(el => el.play().catch(() => { }));
              this.audioContext?.resume();
              document.removeEventListener('click', resumeAudio);
              document.removeEventListener('keydown', resumeAudio);
            };
            document.addEventListener('click', resumeAudio);
            document.addEventListener('keydown', resumeAudio);
          }
        });
      }
    }
  }
}