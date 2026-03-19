# PRD: Image Sharing and Link Rendering (v1.8)

## 1. Overview
VoiceRoom will allow users to share images directly in the chat and ensure that URLs are rendered as clickable links. This improves the communication experience beyond just text and voice.

## 2. User Experience (UX)
### 2.1 Image Sharing
- **Input**: Users can paste images from their clipboard (`Ctrl+V` / `Cmd+V`) directly into the chat input field.
- **Transmission**: Images are converted to Base64 strings and sent via the existing SignalR `SendChatMessage` hub method.
- **Rendering**:
    - Small thumbnail preview (max 200px height) in the chat message bubble.
    - Click-to-Expand: Clicking the thumbnail opens the image in a full-screen overlay (lightbox).
- **Format**: Supports common web formats (JPEG, PNG, GIF, WEBP).

### 2.2 Link Rendering
- **Detection**: Automatically detect URLs in text messages (e.g., starting with `http://`, `https://`).
- **Interaction**: Render detected URLs as clickable blue links that open in a new tab (`target="_blank"`).

## 3. Technical Requirements
### 3.1 Frontend
- **Clipboard API**: Listen for `paste` events on the chat input.
- **Base64 Handling**: Convert `Blob` from clipboard to `data:image/...` string.
- **Message Model**: Update the message parsing logic to distinguish between plain text and image payloads (or support mixed content).
- **Lightbox**: Simple absolute-positioned overlay for full-size viewing.
- **Regex**: Use a standard URL regex to sanitize and linkify text content.

### 3.2 Backend
- **Constraint**: Since we use Base64, SignalR message size limits must be considered.
- **Validation**: (Optional) Basic check to ensure the payload is a valid image or reasonably sized text.

## 4. Constraints
- **Message Size**: Limit pasted images to a reasonable size (e.g., < 1MB) to prevent SignalR performance degradation.
- **Persistence**: Images will be saved in the room's XML history as Base64 strings (Note: This will increase XML file size significantly).

## 5. Mobile Adaptation
- Support long-press to save or standard tap to expand.
- Ensure the lightbox is dismissible via a close button or swipe.
