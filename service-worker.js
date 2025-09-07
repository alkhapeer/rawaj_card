// App Shell cache-first service worker (v3)
const CACHE_NAME = 'cards-pwa-v3';
const ASSETS = [
  './','./index.html','./styles.css','./app.js','./manifest.json',
  './assets/icon-192.png','./assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.url.includes('script.google.com/macros/')) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
  } else {
    event.respondWith(caches.match(req).then(cached => cached || fetch(req)));
  }
});
