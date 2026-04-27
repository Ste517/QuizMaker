const CACHE_NAME = 'quizmaker-v5';
const ASSETS = [
  '/',
  '/index.html',
  '/about/',
  '/editor/',
  '/contribute/',
  '/changelog/',
  '/assets/js/app.js',
  '/assets/js/editor.js',
  '/assets/css/markdown.css',
  '/data/index.json',
  '/data/contributors.json',
  '/data/changelog.json',
  '/assets/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js',
  'https://cdn.jsdelivr.net/npm/marked-katex-extension@5.1.2/lib/index.umd.js'
];

// Installazione: cache delle risorse statiche
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Attivazione: pulizia vecchie cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch: strategia Cache-First con fallback su Network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
