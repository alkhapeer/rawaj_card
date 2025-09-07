// service-worker (v5)
const CACHE_NAME = 'cards-pwa-v5';
const ASSETS = [
  './','./index.html','./styles.css','./app.js','./manifest.json',
  './icon-192.png','./icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try { await cache.addAll(ASSETS); } catch (e) { console.warn('precache skip', e); }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.url.includes('script.google.com/macros/')) {
    // network-first for GAS; fallback to cache or 504 Response
    event.respondWith(
      fetch(req).catch(async () =>
        (await caches.match(req)) || new Response('', { status: 504, statusText: 'Gateway Timeout' })
      )
    );
    return;
  }

  // cache-first for app shell; safe fallback Response if both fail
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
      .catch(() => new Response('', { status: 504, statusText: 'Offline' }))
  );
});
