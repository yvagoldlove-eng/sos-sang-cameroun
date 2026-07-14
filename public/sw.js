self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});

self.addEventListener("fetch", () => {
  // Pas de mise en cache pour l'instant, juste la présence du service worker
});
