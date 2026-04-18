// Keep7 Service Worker — caches app shell for offline use
const CACHE_NAME = 'keep7-shell-v1';
const SHELL_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './js/main.js',
  './js/ui.js',
  './js/engine.js',
  './js/parser.js',
  './js/metrics.js',
  './js/storage.js',
  './js/hash.js',
  './js/scryfall.js',
  './js/zoom.js',
  './js/domUtils.js',
  './js/goldfish.js',
  './js/goldfishUi.js',
  './js/race.js',
  './js/raceUi.js',
  './js/remoteDeck.js',
  './js/sampleDeck.js',
  './manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // For app shell — cache-first
  if (SHELL_ASSETS.some(a => url.pathname.endsWith(a.replace('./', '')))) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
    return;
  }

  // For Scryfall API — network-first with cache fallback
  if (url.hostname === 'api.scryfall.com') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else — network passthrough
  event.respondWith(fetch(event.request));
});
