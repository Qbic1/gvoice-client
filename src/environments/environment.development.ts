export const environment = {
  production: false,
  rootUrl: 'http://localhost:5293',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:voice-room.ru:3478?transport=udp',
      username: 'webrtcuser',
      credential: 'paste_here'
    },
    {
      urls: 'turn:voice-room.ru:3478?transport=tcp',
      username: 'webrtcuser',
      credential: 'paste_here'
    }
  ]
};
