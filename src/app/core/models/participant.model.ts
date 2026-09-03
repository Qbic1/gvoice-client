export interface Participant {
  connectionId: string;
  displayName: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSharingScreen: boolean;
  isListenOnly: boolean;
  isSpeaking?: boolean;
  /**
   * Avatar slug as broadcast by the server. Deliberately a plain string, not
   * AvatarId: the server validates shape only, so an unknown value must be
   * representable and is resolved to a default at render time.
   */
  avatar?: string;
  volume?: number; // Local volume for this participant (0 to 200)
}
