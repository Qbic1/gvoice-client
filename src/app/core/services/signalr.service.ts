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
  // Emitted after an automatic reconnect completes so consumers (WebRTC) can
  // rebuild peer state under the new connection id.
  public reconnected$ = new Subject<void>();
  // Emitted after the automatic re-Join that follows a reconnect succeeds, i.e.
  // the server has re-registered us. The server registers a rejoining peer with
  // *default* state, so consumers must re-broadcast anything they had toggled.
  public roomRejoined$ = new Subject<void>();

  // 'Connecting'   — first connect, no room UI yet.
  // 'Reconnecting' — transport dropped mid-session; the room stays mounted and
  //                  SignalR is retrying underneath.
  connectionStatus = signal<'Disconnected' | 'Connecting' | 'Reconnecting' | 'Connected' | 'Error'>('Disconnected');
  connectionId = signal<string | null>(null);
  // Why the session ended — shown on the disconnect overlay.
  disconnectReason = signal<string | null>(null);

  // Parameters of the last Join, replayed automatically after a reconnect.
  private lastJoin: { roomId: string, roomPassword: string, displayName: string, isListenOnly: boolean } | null = null;
  // True between the automatic re-Join and its RoomJoined reply. While set, a
  // rejection (room gone after a server restart, wrong password, room filled up)
  // is a terminal session error rather than input for the join form, which is
  // not mounted during a reconnect.
  private rejoinPending = false;
  // Set while we are closing the connection ourselves, so onclose can tell a
  // deliberate exit from a connection that died under us.
  private intentionalStop = false;

  private participantCache = new Map<string, { names: string[], timestamp: number }>();
  private CACHE_DURATION = 10000; // 10 seconds

  constructor() {}

  async fetchRooms(): Promise<RoomInfo[]> {
    try {
      return await firstValueFrom(this.http.get<RoomInfo[]>(`${environment.rootUrl}/rooms`));
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      return [];
    }
  }

  async fetchRoomParticipants(roomId: string): Promise<string[]> {
    const cached = this.participantCache.get(roomId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.names;
    }

    try {
      const names = await firstValueFrom(this.http.get<string[]>(`${environment.rootUrl}/rooms/${roomId}/participants`));
      this.participantCache.set(roomId, { names, timestamp: Date.now() });
      return names;
    } catch (err) {
      console.error(`Failed to fetch participants for room ${roomId}:`, err);
      return [];
    }
  }

  async startConnection(roomId: string | null): Promise<boolean> {
    if (!this.isBrowser || !roomId) return false;

    if (this.hubConnection && this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
      // Replacing a live connection — its onclose must not report a lost session.
      this.intentionalStop = true;
      await this.hubConnection.stop();
      this.intentionalStop = false;
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

    this.hubConnection.onreconnecting((error) => {
      console.warn('SignalR reconnecting:', error);
      // Not 'Connecting': the room UI stays mounted so chat, roster and the
      // controls survive the blip. Tearing it down would drop in-memory chat
      // history and drop the user back onto the password form.
      if (this.lastJoin) {
        this.connectionStatus.set('Reconnecting');
      } else {
        this.connectionStatus.set('Connecting');
      }
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('SignalR reconnected with id:', connectionId);
      this.connectionId.set(connectionId ?? this.hubConnection?.connectionId ?? null);
      // Rebuild WebRTC mesh, then re-join the room so the server re-registers us
      // under the new connection id (otherwise we stay muted/invisible).
      this.reconnected$.next();
      if (this.lastJoin) {
        this.rejoinPending = true;
        this.hubConnection
          ?.invoke('Join', this.lastJoin.roomId, this.lastJoin.roomPassword, this.lastJoin.displayName, this.lastJoin.isListenOnly)
          .catch(err => {
            console.error('Re-join after reconnect failed:', err);
            this.fail('Reconnected to the server, but rejoining the room failed.');
          });
      }
    });

    this.hubConnection.onclose((error) => {
      if (this.intentionalStop) {
        this.intentionalStop = false;
        return;
      }
      console.error('SignalR connection closed:', error);
      this.fail('The connection to the server was lost.');
    });

    this.hubConnection.on('PeerJoined', (participant: Participant) => this.peerJoined$.next(participant));
    this.hubConnection.on('PeerLeft', (connectionId: string, displayName: string) => this.peerLeft$.next({ connectionId, displayName }));
    this.hubConnection.on('RoomJoined', (payload: { name: string, participants: Participant[] }) => {
      const wasRejoin = this.rejoinPending;
      this.rejoinPending = false;
      this.disconnectReason.set(null);
      this.connectionStatus.set('Connected');
      this.roomJoined$.next(payload);
      if (wasRejoin) this.roomRejoined$.next();
    });
    this.hubConnection.on('ReceiveSignal', (fromConnectionId: string, signal: string) => this.receiveSignal$.next({ fromConnectionId, signal }));
    this.hubConnection.on('PeerStateUpdated', (connectionId: string, stateType: string, value: boolean) => this.peerStateUpdated$.next({ connectionId, stateType, value }));
    this.hubConnection.on('RoomFull', () => {
      if (this.failRejoin('The room filled up while you were disconnected.')) return;
      this.roomFull$.next();
    });
    this.hubConnection.on('InvalidPassword', () => {
      if (this.failRejoin('The room password changed while you were disconnected.')) return;
      this.invalidPassword$.next();
    });
    this.hubConnection.on('RoomNotFound', () => {
      // The usual cause: the server restarted and its in-memory rooms are gone.
      if (this.failRejoin('The room no longer exists — the server was restarted.')) return;
      this.roomNotFound$.next();
    });
    this.hubConnection.on('RoomCreated', (room: { id: string, name: string }) => this.roomCreated$.next(room));
    this.hubConnection.on('ReceiveChatMessage', (displayName: string, message: string, timestamp: string) => this.receiveChatMessage$.next({ displayName, message, timestamp }));
    this.hubConnection.on('ReceiveChatHistory', (history: { displayName: string, message: string, timestamp: string }[]) => this.receiveChatHistory$.next(history));

    try {
      await this.hubConnection.start();
      this.connectionId.set(this.hubConnection.connectionId);
      return true;
    } catch (err) {
      console.error('SignalR connection failed:', err);
      this.disconnectReason.set('Could not reach the server.');
      this.connectionStatus.set('Error');
      return false;
    }
  }

  disconnect() {
    this.teardown();
    this.disconnectReason.set(null);
    this.connectionStatus.set('Disconnected');
  }

  /** Ends the session and leaves the user on the disconnect overlay with a reason. */
  private fail(reason: string) {
    this.teardown();
    this.disconnectReason.set(reason);
    // Set last: `teardown` must not be the thing that decides the final status.
    this.connectionStatus.set('Error');
  }

  /**
   * Turns a Join rejection into a terminal error when it arrives in response to
   * the automatic re-Join. Returns true if it was handled that way.
   */
  private failRejoin(reason: string): boolean {
    if (!this.rejoinPending) return false;
    this.rejoinPending = false;
    this.fail(reason);
    return true;
  }

  private teardown() {
    this.lastJoin = null;
    this.rejoinPending = false;
    // stop() resolves asynchronously and fires onclose. Without this flag that
    // handler would turn a deliberate exit (including cancelling a reconnect)
    // into an 'Error', leaving the app on the disconnect overlay — and since the
    // join form only renders while 'Disconnected', the user could never open a
    // room again without reloading.
    //
    // Only raise it when there is really something to close: on an already-dead
    // connection stop() fires no onclose, and a flag left standing would swallow
    // the *next*, genuine disconnect.
    const conn = this.hubConnection;
    if (conn && conn.state !== signalR.HubConnectionState.Disconnected) {
      this.intentionalStop = true;
      conn.stop().finally(() => { this.intentionalStop = false; });
    }
    this.connectionId.set(null);
    this.receiveChatHistory$.next([]);
  }


  async joinRoom(roomId: string, roomPassword: string, displayName: string, isListenOnly: boolean = false) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      // Remember params so we can replay Join automatically after a reconnect.
      this.lastJoin = { roomId, roomPassword, displayName, isListenOnly };
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

  async updateState(stateType: 'muted' | 'deafened' | 'sharingScreen', value: boolean) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('UpdateState', stateType, value);
    }
  }
}
