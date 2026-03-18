# VoiceRoom v1.6: Mobile-Friendly Adaptation (PRD)

## 1. Overview
VoiceRoom will be optimized for mobile browsers (Chrome/Android, Safari/iOS) with a "Mobile-First" approach. The interface will shift from a desktop sidebar layout to a tabbed navigation system, prioritizing touch interactions and installability as a PWA.

## 2. UX & Layout Strategy
The layout will adapt based on screen width (< 768px).

### 2.1 Tabbed Navigation (Mobile Only)
- **Bottom Navigation Bar:** Replaces the desktop sidebar with three tabs:
    - **Room:** Participant list and active voice status.
    - **Chat:** Full-screen chat history and input.
    - **Settings:** PTT configuration and room details.
- **Portrait Only:** The UI is strictly optimized for Portrait orientation. Landscape mode will either be discouraged or maintain the portrait-optimized stack to ensure usability.

### 2.2 Voice & PTT (Toggle-to-Talk)
- **Large Mic Toggle:** In "Room" tab, a large, centered button for voice control.
- **Toggle-to-Talk:** On mobile, PTT will function as a "Toggle" (tap to turn on, tap to turn off). This is more ergonomic than holding a screen area for long periods on mobile.
- **Haptic Feedback:** Short vibration on toggle state change (if supported by browser).

## 3. Feature Specifics

### 3.1 Participant List
- **Vertical List:** Participants appear in a single-column scrollable list.
- **Touch Targets:** Minimum 48px height for all interactive elements (Mute, Deafen toggles).

### 3.2 Text Chat
- **Keyboard Resilience:** Uses `svh` (small viewport height) or `dvh` (dynamic viewport height) units to ensure the input field stays above the virtual keyboard without breaking the layout.
- **No In-App Notifications:** New messages will not trigger toasts/banners while the user is in the "Room" tab, keeping the UI minimal and focused.

### 3.3 Progressive Web App (PWA)
- **Installability:** Add `manifest.json` and a basic service worker to allow "Add to Home Screen."
- **Standalone Mode:** Hides browser UI (address bar, navigation) to provide a native-app feel.
- **Icons:** Standardized monochrome icons (192px and 512px).

## 4. Technical Requirements
- **Tailwind Breakpoints:** Heavy use of `hidden md:block` and `block md:hidden` to swap between the Sidebar (desktop) and Bottom-Tab (mobile) layouts.
- **Meta Tags:** Proper viewport and `apple-mobile-web-app-capable` tags.

## 5. UI/UX Aesthetic
- **Modern Minimalist:** Maintain the monochrome palette.
- **Soft Touch UI:** Use larger corner radii (16px) for cards and buttons on mobile to align with mobile OS standards.
