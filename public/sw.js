const CACHE_NAME = 'unisoko-shell-v2';
const MAX_CACHED_NAVIGATIONS = 20;
const SHELL_URLS = ['/', '/manifest.json', '/icons/unisoko-pwa.svg'];

async function cacheNavigation(request, response) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  const keys = await cache.keys();
  const navigationKeys = keys.filter((key) => {
    const path = new URL(key.url).pathname;
    return !SHELL_URLS.includes(path) && !path.startsWith('/_next/');
  });
  const excess = navigationKeys.length - MAX_CACHED_NAVIGATIONS;
  if (excess > 0) await Promise.all(navigationKeys.slice(0, excess).map((key) => cache.delete(key)));
}

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
  if (['/admin', '/order', '/checkout', '/track', '/winga/dashboard'].some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`))) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok && response.status === 200 && response.type === 'basic') {
        void cacheNavigation(request, response).catch(() => undefined);
      }
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match('/'))));
    return;
  }

  if (url.pathname.startsWith('/_next/static/') || SHELL_URLS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) void caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        return response;
      }).catch((error) => {
        if (cached) return cached;
        throw error;
      });
      return cached || network;
    }));
  }
});
