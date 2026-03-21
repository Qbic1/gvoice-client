export interface Participant {
  connectionId: string;
  displayName: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSharingScreen: boolean;
  isListenOnly: boolean;
  isSpeaking?: boolean;
  volume?: number; // Local volume for this participant (0 to 200)
}
