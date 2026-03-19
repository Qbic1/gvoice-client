import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SignalRService } from './signalr.service';
import { ParticipantService } from './participant.service';
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

  private peerConnections = new Map<string, RTCPeerConnection>();
  private pendingConnections = new Map<string, Promise<RTCPeerConnection>>();
  private localStream: MediaStream | null = null;
  private remoteStreams = new Map<string, MediaStream>();

  // Audio Graph Management
  public audioContext: AudioContext | null = null;
  private participantGainNodes = new Map<string, GainNode>();
  private participantSourceNodes = new Map<string, MediaStreamAudioSourceNode>();
  private audioElements = new Map<string, HTMLAudioElement>();

  public localStream$ = new ReplaySubject<MediaStream>(1);
  public peerStreamAdded$ = new Subject<{ connectionId: string, stream: MediaStream }>();

  isMuted = signal(false);
  isPttMode = signal(false);
  isPttActive = signal(false);
  isDeafened = signal(false);
  private lastMuteStateBeforePtt = false;

  private iceServers: RTCConfiguration = {
    iceServers: environment.iceServers,
    iceCandidatePoolSize: 10
  };

  constructor() {
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

    // Global interaction listener to resume AudioContext (autoplay policy)
    if (this.isBrowser) {
      const resumeAudio = () => {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        // We don't remove it immediately because new nodes might need it later, 
        // but browser usually only needs one interaction to unlock the context.
      };
      document.addEventListener('click', resumeAudio);
      document.addEventListener('keydown', resumeAudio);
    }
  }

  private initAudioContext() {
    if (!this.audioContext && this.isBrowser) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  async getLocalStream(): Promise<MediaStream | null> {
    if (!this.isBrowser) return null;
    if (this.localStream) return this.localStream;

    this.initAudioContext();
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.localStream$.next(this.localStream);

      if (this.isPttMode()) {
        this.setMicEnabled(false);
      } else {
        this.isMuted.set(!this.localStream.getAudioTracks()[0].enabled);
      }

      return this.localStream;
    } catch (err) {
      console.error('Error getting local stream:', err);
      // Join in listen-only mode
      return null;
    }
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

    // Mute microphone when deafened
    if (newState) {
      this.lastMuteStateBeforePtt = this.isMuted(); // reuse this to track state
      this.setMicEnabled(false);
    } else {
      // Un-mute microphone if it was active before deafening
      if (!this.isPttMode()) {
        this.setMicEnabled(!this.lastMuteStateBeforePtt);
      }
    }

    // Update all gain nodes for deafen (Mute all)
    this.participantGainNodes.forEach((gainNode, connectionId) => {
      this.applyParticipantVolume(connectionId);
    });
  }

  setPttActive(active: boolean) {
    if (!this.isPttMode()) return;
    this.isPttActive.set(active);
    this.setMicEnabled(active);
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

    // Gain value: 0.0 to 2.0 (representing 0% to 200%)
    // If deafened, gain is always 0
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
    this.peerConnections.set(connectionId, pc); // set early so ICE callbacks can find it

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalrService.sendSignal(connectionId, JSON.stringify({ ice: event.candidate }));
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      this.remoteStreams.set(connectionId, stream);
      this.peerStreamAdded$.next({ connectionId, stream });
      this.playRemoteStream(connectionId, stream);
    };

    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    if (isOfferor) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.signalrService.sendSignal(connectionId, JSON.stringify({ sdp: offer }));
    }

    return pc;
  }

  private getOrCreatePeerConnection(connectionId: string, isOfferor: boolean): Promise<RTCPeerConnection> {
    // Already fully created
    const existing = this.peerConnections.get(connectionId);
    if (existing) return Promise.resolve(existing);

    // Creation is in-flight — return the same promise instead of starting a second one
    const pending = this.pendingConnections.get(connectionId);
    if (pending) return pending;

    // Start creation and track the promise
    const promise = this.createPeerConnection(connectionId, isOfferor)
      .finally(() => this.pendingConnections.delete(connectionId)); // clean up when done

    this.pendingConnections.set(connectionId, promise);
    return promise;
  }

  private async handleSignal(connectionId: string, signal: string) {
    const data = JSON.parse(signal);

    const pc = await this.getOrCreatePeerConnection(connectionId, false);

    if (data.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      if (data.sdp.type === 'offer') {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.signalrService.sendSignal(connectionId, JSON.stringify({ sdp: answer }));
      }
    } else if (data.ice) {
      await pc.addIceCandidate(new RTCIceCandidate(data.ice));
    }
  }

  private closePeerConnection(connectionId: string) {
    this.pendingConnections.delete(connectionId);
    const pc = this.peerConnections.get(connectionId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(connectionId);
      this.remoteStreams.delete(connectionId);

      // Cleanup Audio Graph
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
    }
  }

  private startVAD(connectionId: string, stream: MediaStream) {
    if (!this.audioContext) return;

    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.3;

    // Tap off the source node (already created) into the analyser
    const source = this.participantSourceNodes.get(connectionId);
    if (!source) return;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const SPEAKING_THRESHOLD = 20; // tweak if too sensitive
    const SILENCE_DEBOUNCE_MS = 800;
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    let isSpeaking = false;

    const check = () => {
      if (!this.participantSourceNodes.has(connectionId)) return; // peer left
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      if (avg > SPEAKING_THRESHOLD) {
        if (!isSpeaking) {
          isSpeaking = true;
          this.participantService.updateSpeakingStatus(connectionId, true);
        }
        if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
      } else {
        if (isSpeaking && !silenceTimer) {
          silenceTimer = setTimeout(() => {
            isSpeaking = false;
            this.participantService.updateSpeakingStatus(connectionId, false);
            silenceTimer = null;
          }, SILENCE_DEBOUNCE_MS);
        }
      }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  private playRemoteStream(connectionId: string, stream: MediaStream) {
    if (!this.isBrowser) return;
    this.initAudioContext();

    if (this.audioContext) {
      // Create Audio Graph for individual volume control (including boost > 1.0)
      try {
        const source = this.audioContext.createMediaStreamSource(stream);
        const gainNode = this.audioContext.createGain();

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        this.participantSourceNodes.set(connectionId, source);
        this.participantGainNodes.set(connectionId, gainNode);

        // Apply initial volume (from storage)
        this.applyParticipantVolume(connectionId);

        this.startVAD(connectionId, stream);

        // Resume context on interaction if needed
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

    // We still keep the HTMLAudioElement for autoplay policy handling and secondary fallback, 
    // but we MUTE it so we don't hear double audio. 
    // Attaching it to the DOM and calling play() is often required to keep the stream flowing.
    let audio = this.audioElements.get(connectionId);
    if (!audio) {
      audio = new Audio();
      audio.autoplay = true;
      audio.muted = true;
      audio.style.display = 'none'; // Ensure it's hidden
      document.body.appendChild(audio); // Append to DOM for better support (e.g. iOS)
      this.audioElements.set(connectionId, audio);
    }

    audio.srcObject = stream;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        if (err.name === 'NotAllowedError') {
          console.warn('Autoplay blocked for peer:', connectionId, '. Will retry on next interaction.');
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
