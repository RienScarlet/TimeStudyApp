// Time Study V2 — Service Worker
// Strategy: Cache-first for app shell + CDN assets, hard offline fallback

const CACHE_VERSION = 'v3';
const CACHE_NAME     = `timestudy-v2-cache-${CACHE_VERSION}`;
const CDN_CACHE_NAME = `timestudy-cdn-${CACHE_VERSION}`;

const OFFLINE_URL = './TimeStudyApp_V2.html';

// ── App shell — precached at install time ────────────────────────────────────
// Every file the app needs to run with zero network access must be listed here.
const PRECACHE_URLS = [
  './TimeStudyApp_V2.html',
  './manifest.json',
  // All icon sizes referenced by the HTML <link> tags and manifest
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png'
];

// ── CDN resources — fetched and cached on first online use ───────────────────
// These are cached aggressively; once cached they serve offline indefinitely.
const CDN_HOSTS = [
  'cdnjs.cloudflare.com'
];

// The exact CDN URLs the app uses — pre-warmed at install time so the app
// works offline even on first load (as long as the SW had one online visit).
const CDN_PRECACHE_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// ── Install: precache app shell + CDN assets ─────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cache the app shell (local files)
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(PRECACHE_URLS)),

      // Cache CDN assets — use {mode:'cors'} and ignore failures gracefully
      // so a flaky network at install time doesn't break the whole SW install.
      caches.open(CDN_CACHE_NAME)
        .then(cache =>
          Promise.allSettled(
            CDN_PRECACHE_URLS.map(url =>
              fetch(new Request(url, { mode: 'cors', credentials: 'omit' }))
                .then(res => {
                  if (res && res.status === 200) cache.put(url, res);
                })
                .catch(() => { /* network unavailable at install — retry on fetch */ })
            )
          )
        )
    ]).then(() => self.skipWaiting())
  );
});

// ── Activate: purge outdated caches ─────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== CDN_CACHE_NAME)
          .map(k => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: serve cached assets, fall back to network ────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignore non-GET and non-http(s) requests (e.g. chrome-extension://)
  if (event.request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // ── CDN assets: cache-first, network fallback, offline-safe ─────────────
  if (CDN_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(
      caches.open(CDN_CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached; // serve from cache immediately

          // Not cached yet — fetch, store, return
          return fetch(event.request, { mode: 'cors', credentials: 'omit' })
            .then(response => {
              if (response && response.status === 200) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Truly offline and not yet cached — return a minimal stub so the
              // page does not hard-error. XLSX export will be unavailable but the
              // rest of the app remains fully functional.
              console.warn('[SW] CDN offline and not cached:', url.href);
              return new Response(
                '/* CDN asset unavailable offline — open the app once while online to cache it */',
                { status: 200, headers: { 'Content-Type': 'application/javascript' } }
              );
            });
        })
      )
    );
    return;
  }

  // ── App shell: cache-first, revalidate in background (stale-while-revalidate)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          // Always kick off a background network refresh
          const networkFetch = fetch(event.request)
            .then(response => {
              if (response && response.status === 200) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => cached || new Response('Offline', { status: 503 }));

          // Serve cache immediately; network updates run in background
          return cached || networkFetch;
        })
      )
    );
    return;
  }
});

// ── Messages from the page (e.g. update prompt) ──────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
