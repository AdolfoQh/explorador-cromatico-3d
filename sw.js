const CACHE = 'cromatico-v4';

// Recursos locales: críticos, deben cachearse sí o sí
const LOCAL_ASSETS = [
  '/explorador-cromatico-3d/',
  '/explorador-cromatico-3d/index.html',
  '/explorador-cromatico-3d/manifest.json',
  '/explorador-cromatico-3d/icons/icon-192.png',
  '/explorador-cromatico-3d/icons/icon-512.png'
];

// Recursos CDN: se cachean si es posible, pero no bloquean instalación
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async cache => {
      // Locales: obligatorios
      await cache.addAll(LOCAL_ASSETS);
      // CDN: opcionales (no falla si no se pueden cachear)
      await Promise.allSettled(
        CDN_ASSETS.map(url =>
          fetch(url, { mode: 'cors' })
            .then(res => { if (res.ok) cache.put(url, res); })
            .catch(() => {})
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cachear respuestas exitosas de CDN en runtime
        if (res.ok && (e.request.url.includes('cdnjs') || e.request.url.includes('jsdelivr'))) {
          caches.open(CACHE).then(cache => cache.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
