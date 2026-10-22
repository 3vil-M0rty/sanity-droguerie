/*
 * Sanity — service worker for the field app (/m).
 * Keeps the app shell (HTML, JS, CSS) so the app opens without network;
 * the data itself (customers, catalogue, queued orders) lives in
 * IndexedDB (src/pages/field/offlineStore.js). API calls are never
 * cached here: they always go to the network.
 */
const CACHE = "sanity-shell-v1";
const SHELL = ["/m", "/icon.svg", "/manifest-field.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  // Pages: network first, the cached shell when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put("/m", copy));
        return res;
      }).catch(() => caches.match("/m")),
    );
    return;
  }
  // Built assets are content-hashed: cache first.
  if (url.pathname.startsWith("/assets/") || SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
  }
});
