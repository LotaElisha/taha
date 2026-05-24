// Superseded by vite-plugin-pwa. The generated SW lives at /sw.js after build.
// This stub stays so any old client that still references this path during a
// rolling deploy gets a no-op, then upgrades to the generated SW on next load.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
