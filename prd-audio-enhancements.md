# PRD: Lightweight Audio Enhancement Suite (v1.5)

## 1. Executive Summary
- **Product Name:** VoiceRoom
- **Feature Name:** Lightweight Audio Enhancement Suite
- **Goal:** Deliver cleaner, gaming-optimized voice chat by suppressing keyboard clicks, breathing sounds, and background hum.
- **Approach:** Lightweight Web Audio API chain; no AI/DSP overhead.

## 2. Problem Statement
Gamers and remote collaborators often deal with distracting background noise (mechanical keyboards, heavy breathing, PC fans). Heavy AI-based noise suppression adds significant latency and CPU overhead. We need a "80/20" solution that is efficient and effective.

## 3. Functional Requirements
- **F1: Enhanced Mic Stream (Send):** Apply a `HighPassFilter` (120Hz), `NoiseGate` (Sensitivity-based), and `DynamicsCompressor` to the local MediaStream before transmitting via WebRTC.
- **F2: Clean Remote Streams (Receive):** Apply a `HighPassFilter` (120Hz) to all incoming remote audio streams to eliminate low-frequency rumble.
- **F3: Manual Sensitivity Slider:** A single slider in the Settings modal (0.00 to 0.10 range) to control the `NoiseGate` threshold.
- **F4: Master Toggle:** A single "Enhance Audio Quality" toggle in Settings (Default: On).
- **F5: Audio Level Meter:** A real-time visual indicator in the Settings modal (0–100%) to help users tune their sensitivity.
- **F6: Disable AGC:** Programmatically disable browser `autoGainControl` when enhancements are active to prevent volume pumping.

## 4. UI/UX Requirements (Monochrome Focus)
- **Settings Integration:** Add an "Audio" section to the existing Settings Modal.
- **Sensitivity Slider:** A horizontal slider with a zinc-colored track and black thumb.
- **Level Meter:** A thin zinc bar that fills with black/emerald based on input volume.
- **Toggle:** A minimalist switch component.

## 5. Technical Constraints
- **Latency:** Must maintain <150ms end-to-end latency.
- **CPU:** Must be negligible (<1% CPU overhead on modern systems).
- **Angular:** Processing must run outside the Angular Zone to avoid triggering excessive change detection.
- **Persistence:** Save settings in `localStorage` and sync with the backend `Participant` model.

## 6. Out of Scope
- AI-based noise cancellation (RNNoise, etc.).
- Deep-learning echo cancellation.
- Per-participant noise gate settings (gate is global/source-side).

## 7. Success Metrics
- Discernible reduction in keyboard "idle" noise when not speaking.
- Elimination of low-frequency "rumble" from cheap microphones.
- No reported increases in audio latency.
