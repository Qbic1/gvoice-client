import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { ParticipantService } from './participant.service';
import { SignalRService } from './signalr.service';
import { Participant } from '../models/participant.model';

// Minimal mock of SignalRService exposing only the streams/signals the
// ParticipantService subscribes to in its constructor. Shapes MUST match the
// real service (see signalr.service.ts) — a mismatch here is exactly the kind
// of drift the previous version of this spec suffered from.
class MockSignalRService {
  roomJoined$ = new ReplaySubject<{ name: string; participants: Participant[] }>(1);
  peerJoined$ = new Subject<Participant>();
  peerLeft$ = new Subject<{ connectionId: string; displayName: string }>();
  peerStateUpdated$ = new Subject<{ connectionId: string; stateType: string; value: boolean }>();
  connectionId = signal<string | null>(null);
}

function makeParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    connectionId: '1',
    displayName: 'Alice',
    isMuted: false,
    isDeafened: false,
    isSharingScreen: false,
    isListenOnly: false,
    isSpeaking: false,
    ...overrides,
  };
}

describe('ParticipantService', () => {
  let service: ParticipantService;
  let signalr: MockSignalRService;

  beforeEach(() => {
    // jsdom provides localStorage; start from a clean slate so stored volumes
    // from other tests don't leak in via getStoredVolume().
    localStorage.clear();
    signalr = new MockSignalRService();

    TestBed.configureTestingModule({
      providers: [
        ParticipantService,
        { provide: SignalRService, useValue: signalr },
      ],
    });

    service = TestBed.inject(ParticipantService);
  });

  it('is created and starts empty', () => {
    expect(service).toBeTruthy();
    expect(service.participants()).toEqual([]);
  });

  it('populates participants (with default volume) and room name on roomJoined', () => {
    const alice = makeParticipant({ connectionId: '1', displayName: 'Alice' });
    const bob = makeParticipant({ connectionId: '2', displayName: 'Bob', isMuted: true });

    signalr.roomJoined$.next({ name: 'General', participants: [alice, bob] });

    const list = service.participants();
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ connectionId: '1', displayName: 'Alice', volume: 100 });
    expect(list[1]).toMatchObject({ connectionId: '2', isMuted: true, volume: 100 });
    expect(service.roomName()).toBe('General');
  });

  it('applies a stored volume from localStorage on roomJoined', () => {
    localStorage.setItem('gv_vol_Alice', '42');
    signalr.roomJoined$.next({ name: 'General', participants: [makeParticipant({ displayName: 'Alice' })] });

    expect(service.participants()[0].volume).toBe(42);
  });

  it('adds a participant on peerJoined', () => {
    signalr.peerJoined$.next(makeParticipant({ connectionId: '3', displayName: 'Charlie' }));

    expect(service.participants()).toHaveLength(1);
    expect(service.participants()[0]).toMatchObject({ connectionId: '3', volume: 100 });
  });

  it('removes a participant on peerLeft', () => {
    service.participants.set([
      makeParticipant({ connectionId: '1' }),
      makeParticipant({ connectionId: '2', displayName: 'Bob' }),
    ]);

    signalr.peerLeft$.next({ connectionId: '1', displayName: 'Alice' });

    expect(service.participants()).toHaveLength(1);
    expect(service.participants()[0].connectionId).toBe('2');
  });

  it('updates muted / deafened / sharingScreen on peerStateUpdated (case-insensitive)', () => {
    service.participants.set([makeParticipant({ connectionId: '1' })]);

    signalr.peerStateUpdated$.next({ connectionId: '1', stateType: 'muted', value: true });
    expect(service.participants()[0].isMuted).toBe(true);

    signalr.peerStateUpdated$.next({ connectionId: '1', stateType: 'Deafened', value: true });
    expect(service.participants()[0].isDeafened).toBe(true);

    signalr.peerStateUpdated$.next({ connectionId: '1', stateType: 'sharingScreen', value: true });
    expect(service.participants()[0].isSharingScreen).toBe(true);
  });

  it('identifies the local participant by connectionId', () => {
    service.participants.set([
      makeParticipant({ connectionId: '1', displayName: 'Alice' }),
      makeParticipant({ connectionId: 'local-id', displayName: 'Me' }),
    ]);
    signalr.connectionId.set('local-id');

    expect(service.localParticipant()?.displayName).toBe('Me');
  });

  it('exposes isAnyScreenSharing', () => {
    service.participants.set([makeParticipant({ connectionId: '1' })]);
    expect(service.isAnyScreenSharing()).toBe(false);

    service.participants.set([makeParticipant({ connectionId: '1', isSharingScreen: true })]);
    expect(service.isAnyScreenSharing()).toBe(true);
  });

  it('updateSpeakingStatus toggles speaking and keeps identity when unchanged', () => {
    service.participants.set([makeParticipant({ connectionId: '1', isSpeaking: false })]);

    service.updateSpeakingStatus('1', true);
    expect(service.participants()[0].isSpeaking).toBe(true);

    const ref = service.participants()[0];
    service.updateSpeakingStatus('1', true); // same value → no new object
    expect(service.participants()[0]).toBe(ref);
  });

  it('updateParticipantVolume updates state and persists to localStorage', () => {
    service.participants.set([makeParticipant({ connectionId: '1', displayName: 'Alice' })]);

    service.updateParticipantVolume('1', 150);

    expect(service.participants()[0].volume).toBe(150);
    expect(localStorage.getItem('gv_vol_Alice')).toBe('150');
  });
});
