const CACHE_NAME = 'neva-cache-v1.0.31-offline';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/sounds/tibetan_bowl.wav',
  '/sounds/zen_gong.wav',
  '/sounds/temple_bell.wav',
  '/sounds/gentle_bell.wav',
  '/sounds/crystal_chime.wav',
  '/sounds/sacred_chimes.wav',
  '/sounds/gentle_harp.wav',
  '/sounds/digital_alert.wav',
  '/sounds/timer_start_music.wav',
  '/sounds/celestial_harp.wav',
  '/sounds/mindful_chime.wav',
  '/sounds/pulse_alert.wav',
  '/sounds/morning_dew.wav',
  '/sounds/touch_pencil.wav',
  '/sounds/touch_pop.wav',
  '/sounds/touch_click.wav',
  '/sounds/touch_chime.wav',
  '/sounds/touch_wood.wav',
  '/sounds/touch_droplet.wav',
  '/sounds/touch_haptic.wav',
  '/sounds/touch_paper.wav',
  '/sounds/touch_marimba.wav',
  '/sounds/ambience_432hz.wav',
  '/sounds/ambience_rain.wav',
  '/sounds/ambience_stream.wav',
  '/sounds/ambience_whitenoise.wav'
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

  // Sound assets - Cache-first with network fallback (instant playback, 0 network latency, 100% offline)
  if (url.pathname.startsWith('/sounds/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        }).catch(() => new Response('', { status: 404 }));
      })
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
