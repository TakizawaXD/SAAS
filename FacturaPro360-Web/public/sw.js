// Service Worker de auto-desinstalación y purga para FacturaPro 360
// Evita el almacenamiento en caché de bundles con hashes antiguos (MIME text/html errors)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // No interceptar ni servir caché obsoleta; ir directo a la red
  event.respondWith(fetch(event.request));
});
