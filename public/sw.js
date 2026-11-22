const CACHE_NAME = 'neva-cache-v1.0.24-clean';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  // Instantly take over without waiting for user to close tabs
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting stale cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API sync/auth endpoints or version.json - always fresh over network
  if (url.pathname.startsWith('/api/') || url.pathname.includes('version.json')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => new Response('{"offline":true}', { headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }

  // Navigation requests (HTML pages) - Network-first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const resClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const fallback = await caches.match('/index.html') || await caches.match('/');
          if (fallback) return fallback;
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts) - Network-first for Vite hashed assets, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const contentType = networkResponse.headers.get('content-type') || '';
          // Strictly reject HTML responses for JS/CSS assets (prevents MIME type poisoning!)
          if (url.pathname.startsWith('/assets/') && contentType.includes('text/html')) {
            return new Response('Asset not found', { status: 404 });
          }
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response('Asset offline', { status: 503 });
      })
  );
});
