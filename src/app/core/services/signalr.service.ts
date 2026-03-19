import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import * as signalR from '@microsoft/signalr';
import { Subject, firstValueFrom, ReplaySubject } from 'rxjs';
import { Participant } from '../models/participant.model';
import { environment } from '../../../environments/environment.development';

export interface RoomInfo {
  id: string;
  name: string;
  participantCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private isBrowser = isPlatformBrowser(this.platformId);
  private hubConnection: signalR.HubConnection | null = null;

  public peerJoined$ = new Subject<Participant>();
  public peerLeft$ = new Subject<{ connectionId: string, displayName: string }>();
  public roomJoined$ = new ReplaySubject<{ name: string, participants: Participant[] }>(1);
  public receiveSignal$ = new Subject<{ fromConnectionId: string, signal: string }>();
  public peerStateUpdated$ = new Subject<{ connectionId: string, stateType: string, value: boolean }>();
  public roomFull$ = new Subject<void>();
  public invalidPassword$ = new Subject<void>();
  public roomNotFound$ = new Subject<void>();
  public roomCreated$ = new Subject<{ id: string, name: string }>();
  public receiveChatMessage$ = new Subject<{ displayName: string, message: string, timestamp: string }>();
  public receiveChatHistory$ = new ReplaySubject<{ displayName: string, message: string, timestamp: string }[]>(1);

  connectionStatus = signal<'Disconnected' | 'Connecting' | 'Connected' | 'Error'>('Disconnected');
  connectionId = signal<string | null>(null);

  constructor() {}

  async fetchRooms(): Promise<RoomInfo[]> {
    try {
      return await firstValueFrom(this.http.get<RoomInfo[]>(`${environment.rootUrl}/rooms`));
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      return [];
    }
  }

  async startConnection(roomId: string | null): Promise<boolean> {
    if (!this.isBrowser || !roomId) return false;

    if (this.hubConnection && this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
      await this.hubConnection.stop();
    }

    this.connectionStatus.set('Connecting');
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.rootUrl}/hub/signaling`)
      .withAutomaticReconnect()
      .build();

    // Increase message size limit for large images
    this.hubConnection.serverTimeoutInMilliseconds = 120000; // 120 seconds
    this.hubConnection.keepAliveIntervalInMilliseconds = 15000;
    
    // This is the property that controls the maximum size of a message received FROM the server
    // For sending TO the server, the server-side MaximumReceiveMessageSize is what matters most
    // but we set this to be safe and consistent.
    (this.hubConnection as any).contentDefaultMaxSize = 10 * 1024 * 1024; // 10MB
    // @ts-ignore - access internal property for message size if needed
    if (this.hubConnection['_connection']) {
       // @ts-ignore
       this.hubConnection['_connection'].maxReceiveMessageSize = 10 * 1024 * 1024;
    }

    this.hubConnection.onclose((error) => {
      console.error('SignalR connection closed:', error);
      this.connectionStatus.set('Error');
      this.disconnect();
    });

    this.hubConnection.on('PeerJoined', (participant: Participant) => this.peerJoined$.next(participant));
    this.hubConnection.on('PeerLeft', (connectionId: string, displayName: string) => this.peerLeft$.next({ connectionId, displayName }));
    this.hubConnection.on('RoomJoined', (payload: { name: string, participants: Participant[] }) => {
      this.connectionStatus.set('Connected');
      this.roomJoined$.next(payload);
    });
    this.hubConnection.on('ReceiveSignal', (fromConnectionId: string, signal: string) => this.receiveSignal$.next({ fromConnectionId, signal }));
    this.hubConnection.on('PeerStateUpdated', (connectionId: string, stateType: string, value: boolean) => this.peerStateUpdated$.next({ connectionId, stateType, value }));
    this.hubConnection.on('RoomFull', () => this.roomFull$.next());
    this.hubConnection.on('InvalidPassword', () => this.invalidPassword$.next());
    this.hubConnection.on('RoomNotFound', () => this.roomNotFound$.next());
    this.hubConnection.on('RoomCreated', (room: { id: string, name: string }) => this.roomCreated$.next(room));
    this.hubConnection.on('ReceiveChatMessage', (displayName: string, message: string, timestamp: string) => this.receiveChatMessage$.next({ displayName, message, timestamp }));
    this.hubConnection.on('ReceiveChatHistory', (history: { displayName: string, message: string, timestamp: string }[]) => this.receiveChatHistory$.next(history));

    try {
      await this.hubConnection.start();
      this.connectionId.set(this.hubConnection.connectionId);
      return true;
    } catch (err) {
      console.error('SignalR connection failed:', err);
      this.connectionStatus.set('Error');
      return false;
    }
  }

  disconnect() {
    this.hubConnection?.stop();
    this.connectionStatus.set('Disconnected');
    this.connectionId.set(null);
    this.receiveChatHistory$.next([]);
  }


  async joinRoom(roomId: string, roomPassword: string, displayName: string, isListenOnly: boolean = false) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('Join', roomId, roomPassword, displayName, isListenOnly);
    } else {
      console.error('Cannot join room: SignalR is not connected.');
    }
  }

  async createRoom(adminPassword: string, roomName: string, roomPassword: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('CreateRoom', adminPassword, roomName, roomPassword);
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
