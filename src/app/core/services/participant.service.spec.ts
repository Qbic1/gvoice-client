import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParticipantService } from './participant.service';
import { SignalRService } from './signalr.service';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Participant } from '../models/participant.model';

// Mock SignalRService
class MockSignalRService {
  roomJoined$ = new Subject<Participant[]>();
  peerJoined$ = new Subject<Participant>();
  peerLeft$ = new Subject<{ connectionId: string, displayName: string }>();
  peerStateUpdated$ = new Subject<{ connectionId: string, stateType: string, value: boolean }>();
  connectionId = signal<string | null>(null);
}

describe('ParticipantService', () => {
  let service: ParticipantService;
  let mockSignalrService: MockSignalRService;

  beforeEach(() => {
    // Create a new instance of the mock service for each test
    mockSignalrService = new MockSignalRService();

    // Manually instantiate the service with the mock
    service = new ParticipantService(mockSignalrService as unknown as SignalRService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with an empty participant list', () => {
    expect(service.participants()).toEqual([]);
  });

  it('should populate participants on roomJoined event', () => {
    const existingParticipants: Participant[] = [
      { connectionId: '1', displayName: 'Alice', isMuted: false, isDeafened: false, isSpeaking: false },
      { connectionId: '2', displayName: 'Bob', isMuted: true, isDeafened: false, isSpeaking: false },
    ];
    mockSignalrService.roomJoined$.next(existingParticipants);
    expect(service.participants()).toEqual(existingParticipants);
  });

  it('should add a participant on peerJoined event', () => {
    const newParticipant: Participant = { connectionId: '3', displayName: 'Charlie', isMuted: false, isDeafened: false, isSpeaking: false };
    mockSignalrService.peerJoined$.next(newParticipant);
    expect(service.participants()).toEqual([newParticipant]);
  });

  it('should remove a participant on peerLeft event', () => {
    // First, add some participants
    const initialParticipants: Participant[] = [
      { connectionId: '1', displayName: 'Alice', isMuted: false, isDeafened: false, isSpeaking: false },
      { connectionId: '2', displayName: 'Bob', isMuted: false, isDeafened: false, isSpeaking: false },
    ];
    service.participants.set(initialParticipants);

    // Act
    mockSignalrService.peerLeft$.next({ connectionId: '1', displayName: 'Alice' });

    // Assert
    expect(service.participants().length).toBe(1);
    expect(service.participants()[0].connectionId).toBe('2');
  });

  it("should update a participant's muted state on peerStateUpdated event", () => {
    // First, add a participant
    const participant: Participant = { connectionId: '1', displayName: 'Alice', isMuted: false, isDeafened: false, isSpeaking: false };
    service.participants.set([participant]);

    // Act
    mockSignalrService.peerStateUpdated$.next({ connectionId: '1', stateType: 'muted', value: true });

    // Assert
    expect(service.participants()[0].isMuted).toBe(true);
  });

  it("should update a participant's deafened state on peerStateUpdated event", () => {
    const participant: Participant = { connectionId: '1', displayName: 'Alice', isMuted: false, isDeafened: false, isSpeaking: false };
    service.participants.set([participant]);
    
    mockSignalrService.peerStateUpdated$.next({ connectionId: '1', stateType: 'deafened', value: true });
    
    expect(service.participants()[0].isDeafened).toBe(true);
  });
  
  it('should correctly identify the local participant', () => {
    const participants: Participant[] = [
        { connectionId: '1', displayName: 'Alice', isMuted: false, isDeafened: false, isSpeaking: false },
        { connectionId: 'local-id', displayName: 'Me', isMuted: false, isDeafened: false, isSpeaking: false },
    ];
    service.participants.set(participants);
    mockSignalrService.connectionId.set('local-id');

    expect(service.localParticipant()?.displayName).toBe('Me');
  });

  it('should update speaking status', () => {
    const participant: Participant = { connectionId: '1', displayName: 'Alice', isMuted: false, isDeafened: false, isSpeaking: false };
    service.participants.set([participant]);

    service.updateSpeakingStatus('1', true);
    expect(service.participants()[0].isSpeaking).toBe(true);

    service.updateSpeakingStatus('1', false);
    expect(service.participants()[0].isSpeaking).toBe(false);
  });

  it('should not update state if speaking status is the same', () => {
    const participant: Participant = { connectionId: '1', displayName: 'Alice', isMuted: false, isDeafened: false, isSpeaking: false };
    service.participants.set([participant]);
    
    const originalParticipant = service.participants()[0];

    // call update with the same value
    service.updateSpeakingStatus('1', false); 
    
    // check that the object reference has not changed
    expect(service.participants()[0]).toBe(originalParticipant);
  });
});
