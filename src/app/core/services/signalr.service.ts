import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { Participant } from '../models/participant.model';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private hubConnection: signalR.HubConnection | null = null;

  public peerJoined$ = new Subject<Participant>();
  public peerLeft$ = new Subject<{ connectionId: string, displayName: string }>();
  public roomJoined$ = new Subject<Participant[]>();
  public receiveSignal$ = new Subject<{ fromConnectionId: string, signal: string }>();
  public peerStateUpdated$ = new Subject<{ connectionId: string, stateType: string, value: boolean }>();
  public roomFull$ = new Subject<void>();
  public receiveChatMessage$ = new Subject<{ displayName: string, message: string, timestamp: string }>();

  connectionStatus = signal<'Disconnected' | 'Connecting' | 'Connected' | 'Error'>('Disconnected');
  connectionId = signal<string | null>(null);

  constructor() {}

  async startConnection() {
    if (!this.isBrowser) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5293/hub/signaling') // Updated port
      .build();

    this.hubConnection.onclose((error) => {
      console.error('SignalR connection closed:', error);
      this.connectionStatus.set('Error');
    });

    this.hubConnection.on('PeerJoined', (participant: Participant) => {
      this.peerJoined$.next(participant);
    });

    this.hubConnection.on('PeerLeft', (connectionId: string, displayName: string) => {
      this.peerLeft$.next({ connectionId, displayName });
    });

    this.hubConnection.on('RoomJoined', (existingParticipants: Participant[]) => {
      this.roomJoined$.next(existingParticipants);
    });

    this.hubConnection.on('ReceiveSignal', (fromConnectionId: string, signal: string) => {
      this.receiveSignal$.next({ fromConnectionId, signal });
    });

    this.hubConnection.on('PeerStateUpdated', (connectionId: string, stateType: string, value: boolean) => {
      this.peerStateUpdated$.next({ connectionId, stateType, value });
    });

    this.hubConnection.on('RoomFull', () => {
      this.roomFull$.next();
    });

    this.hubConnection.on('ReceiveChatMessage', (displayName: string, message: string, timestamp: string) => {
      this.receiveChatMessage$.next({ displayName, message, timestamp });
    });

    try {
      console.log('Attempting to connect to SignalR hub at http://localhost:5293/hub/signaling...');
      this.connectionStatus.set('Connecting');
      await this.hubConnection.start();
      console.log('SignalR connected with ConnectionID:', this.hubConnection.connectionId);
      this.connectionId.set(this.hubConnection.connectionId);
      this.connectionStatus.set('Connected');
    } catch (err) {
      console.error('SignalR connection failed:', err);
      this.connectionStatus.set('Error');
    }
  }

  async joinRoom(displayName: string, isListenOnly: boolean = false) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      console.log('Sending Join request for:', displayName, 'isListenOnly:', isListenOnly);
      await this.hubConnection.invoke('Join', displayName, isListenOnly);
    } else {
      console.error('Cannot join room: SignalR is not connected.');
    }
  }

  async sendSignal(targetConnectionId: string, signal: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SendSignal', targetConnectionId, signal);
    }
  }

  async sendChatMessage(message: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SendChatMessage', message);
    }
  }

  async updateState(stateType: 'muted' | 'deafened', value: boolean) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('UpdateState', stateType, value);
    }
  }
}
