export const environment = {
  production: true,
  rootUrl: '/api',
  turnPassword: '',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:voice-room.ru:3478?transport=udp',
      username: 'webrtcuser',
      credential: ''
    },
    {
      urls: 'turn:voice-room.ru:3478?transport=tcp',
      username: 'webrtcuser',
      credential: ''
    }
  ]
};
