# PRD: Per-User Volume Control (v1.7)

## 1. Overview
VoiceRoom will allow users to adjust the audio volume of other participants individually. This is a critical feature for balancing audio in a mesh network where different users may have varying microphone sensitivities.

## 2. User Experience (UX)
- **Interaction**: Clicking on a participant's name or avatar in the `ParticipantList` will open a small pop-over (context menu).
- **Control**: The pop-over will contain a horizontal volume slider.
- **Range**: The slider will range from **0% (Muted)** to **200% (Boosted)**.
- **Feedback**: As the slider is moved, the audio level of that specific participant will change in real-time.
- **Persistence**: The volume setting for a specific participant (identified by their connection ID/Display Name) will be saved in the browser's `localStorage` and automatically applied if they rejoin in the same or future sessions.

## 3. Technical Requirements
- **WebRTC Integration**: The volume adjustment must be applied directly to the `MediaStream` or `HTMLAudioElement` associated with the remote participant in `WebRtcService`.
- **UI Components**:
    - Add a pop-over/context menu triggered from `ParticipantListComponent`.
    - Create a reusable `VolumeSliderComponent` or integrate it into the pop-over.
- **State Management**:
    - `WebRtcService` should manage a map of `connectionId -> volume`.
    - `localStorage` should be used to store a persistent map of `displayName -> volume` (since connection IDs change). *Note: Using Display Name is a fallback since we lack unique IDs in v1.*

## 4. Mobile Adaptation
- On mobile, the pop-over should appear as a bottom sheet or a centered modal to ensure it is easy to interact with on touch screens.
- Haptic feedback on volume change (if supported).

## 5. Constraints
- The 200% boost will use the Web Audio API's `GainNode` if the standard `HTMLAudioElement.volume` (0.0 to 1.0) is insufficient.
