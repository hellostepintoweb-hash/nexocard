const CACHE_NAME = 'digital-card-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/square_logo.png',
  '/Logo.png',
  '/background.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});