const CACHE_NAME = 'voiceroom-v3';
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Immediately take control, don't wait for old SW to expire
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete all old caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept: JS/CSS/wasm modules, API calls, SignalR/WebSocket upgrades
  if (
    event.request.mode === 'websocket' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.mjs') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.wasm')
  ) {
    return; // Fall through to network, no interception
  }

  // For navigation requests (actual page loads), use network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html')
      )
    );
    return;
  }

  // For remaining static assets (favicon, manifest), use cache-first
  event.respondWith(
    caches.match(event.request).then((response) =>
      response || fetch(event.request).catch((err) => {
        console.error('[SW] Fetch failed for:', event.request.url, err);
        throw err;
      })
    )
  );
});