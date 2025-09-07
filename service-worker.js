// App Shell cache-first service worker (v4)
const CACHE_NAME = 'cards-pwa-v4';
const ASSETS = [
  './','./index.html','./styles.css','./app.js','./manifest.json',
  './icon-192.png','./icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try { await cache.addAll(ASSETS); }
    catch (e) { console.warn('Precache skipped:', e); }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k!==CACHE_NAME).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Apps Script: network-first (ولو فشل رجّع من الكاش إن وُجد)
  if (req.url.includes('script.google.com/macros/')) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
  } else {
    event.respondWith(caches.match(req).then(cached => cached || fetch(req)));
  }
});
