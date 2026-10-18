// Service Worker con política Network-First para FacturaPro 360
const CACHE_NAME = 'facturapro-pwa-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Network first: siempre buscar la versión más reciente en la red
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
