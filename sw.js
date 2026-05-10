// Time Study V2 — Service Worker
// Strategy: Cache-first for app shell, network-first for CDN assets

const CACHE_NAME = 'timestudy-v2-cache-v1';
const OFFLINE_URL = './TimeStudyApp_V2.html';

// App shell — always cache these
const PRECACHE_URLS = [
  './TimeStudyApp_V2.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// CDN resources — cache on first use
const CDN_CACHE_NAME = 'timestudy-cdn-v1';
const CDN_HOSTS = [
  'cdnjs.cloudflare.com'
];

// ── Install: precache app shell ──────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ───────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== CDN_CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: serve from cache, fall back to network ───────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) schemes
  if (!url.protocol.startsWith('http')) return;

  // CDN assets: cache-first with network fallback
  if (CDN_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(
      caches.open(CDN_CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // App shell: cache-first, update in background (stale-while-revalidate)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          const networkFetch = fetch(event.request).then(response => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => cached); // offline: return cached

          // Return cached immediately; update cache in background
          return cached || networkFetch;
        })
      )
    );
    return;
  }
});

// ── Background Sync: notify clients when back online ────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
