const CACHE_NAME = 'unisoko-shell-v1';
const SHELL_URLS = ['/', '/manifest.json', '/icons/unisoko-pwa.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (['/admin', '/order', '/checkout', '/winga/dashboard'].some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`))) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      const clone = response.clone();
      void caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match('/'))));
    return;
  }

  if (url.pathname.startsWith('/_next/static/') || SHELL_URLS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) void caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        return response;
      });
      return cached || network;
    }));
  }
});
