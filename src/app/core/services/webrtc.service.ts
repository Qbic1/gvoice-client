import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SignalRService } from './signalr.service';
import { Subject, ReplaySubject } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class WebRtcService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private signalrService = inject(SignalRService);

  private peerConnections = new Map<string, RTCPeerConnection>();
  private pendingConnections = new Map<string, Promise<RTCPeerConnection>>();
  private localStream: MediaStream | null = null;
  private remoteStreams = new Map<string, MediaStream>();
  private audioElements = new Map<string, HTMLAudioElement>();

  public localStream$ = new ReplaySubject<MediaStream>(1);
  public peerStreamAdded$ = new Subject<{ connectionId: string, stream: MediaStream }>();

  isMuted = signal(false);
  isPttMode = signal(false);
  isDeafened = signal(false);
  private lastMuteStateBeforePtt = false;

  private iceServers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: 'turn:voice-room.ru:3478?transport=udp',
        username: 'webrtcuser',
        credential: `${environment.turnPassword}`
      },
      {
        urls: 'turn:voice-room.ru:3478?transport=tcp',
        username: 'webrtcuser',
        credential: `${environment.turnPassword}`
      }
    ],
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
  }

  async getLocalStream(): Promise<MediaStream | null> {
    if (!this.isBrowser) return null;
    if (this.localStream) return this.localStream;

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

    // Mute/Unmute all existing remote audio elements
    this.audioElements.forEach(audio => {
      audio.muted = newState;
    });
  }

  setPttActive(active: boolean) {
    if (!this.isPttMode()) return;
    this.setMicEnabled(active);
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

      const audio = this.audioElements.get(connectionId);
      if (audio) {
        audio.pause();
        audio.srcObject = null;
        this.audioElements.delete(connectionId);
      }
    }
  }

  private playRemoteStream(connectionId: string, stream: MediaStream) {
    if (!this.isBrowser) return;

    let audio = this.audioElements.get(connectionId);
    if (!audio) {
      audio = new Audio();
      this.audioElements.set(connectionId, audio);
    }

    audio.srcObject = stream;
    audio.muted = this.isDeafened();
    audio.play().catch(err => console.error('Error playing remote stream:', err));
  }
}
