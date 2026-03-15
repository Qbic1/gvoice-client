export interface Participant {
  connectionId: string;
  displayName: string;
  isMuted: boolean;
  isDeafened: boolean;
  isListenOnly: boolean;
  isSpeaking?: boolean;
}
