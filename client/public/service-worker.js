const CACHE_NAME = "wt-system-cache-v1";
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico'
];

// --- INSTALL ---
self.addEventListener("install", (event) => {
  console.log("[SW] Install event");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching files:", URLS_TO_CACHE);
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// --- ACTIVATE ---
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate event");
});

// --- FETCH ---
self.addEventListener("fetch", (event) => {
  console.log("[SW] Fetch:", event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log("[SW] Serving from cache:", event.request.url);
        return response;
      }
      console.log("[SW] Fetching from network:", event.request.url);
      return fetch(event.request);
    })
  );
});
