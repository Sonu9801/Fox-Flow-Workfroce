// Basic Service Worker for PWA installation
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activated");
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // We just need a fetch listener to pass the PWA installation criteria in Chrome.
  // We can let the browser handle all network requests normally.
  return;
});
