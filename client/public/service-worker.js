const CACHE_NAME = "wt-system-cache-v2"; // 🔥 bump version to reset old cache
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/favicon.ico",
];

// ---------------- INSTALL ----------------
self.addEventListener("install", (event) => {
  console.log("[SW] Install event");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching app shell");
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting(); // activate immediately
});

// ---------------- ACTIVATE ----------------
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate event");

  // 🧹 Remove old caches
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", cache);
            return caches.delete(cache);
          }
        })
      )
    )
  );

  self.clients.claim(); // take control immediately
});

// ---------------- FETCH ----------------
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 🚫 DO NOT intercept API requests or non-GET requests
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api")
  ) {
    return;
  }

  // ✅ Handle navigation (app shell)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // ✅ Cache-first strategy for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => caches.match("/offline.html"));
    })
  );
});
