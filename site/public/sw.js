// Cache only explicitly public shell assets. Clinical/app/data requests must reach
// the network, never an old cached monograph, authenticated response, or error page.
const CACHE_PREFIX = 'rf-site-static-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const OFFLINE_ASSETS = ['/', '/style.css', '/favicon.ico', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(OFFLINE_ASSETS);
    } catch (_) { /* Still retire the old worker when offline caching is unavailable. */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    // Other apps own their own caches. Never clear them as a side effect.
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.search ||
      request.headers.has('authorization') || !OFFLINE_ASSETS.includes(url.pathname)) return;

  // Network first: a successful visit must not silently show last month's shell.
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic' && !response.redirected &&
          !/\b(?:no-store|private)\b/i.test(response.headers.get('cache-control') || '')) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        } catch (_) { /* Cache denial/quota must not break a valid network response. */ }
      }
      return response;
    } catch (_) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) return cached;
      } catch (_) { /* Return an explicit offline error even when storage is denied. */ }
      return new Response('Offline. Reconnect to load this page.', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
