// Offline support: keeps a copy of the app files so it opens without internet.
// Your data is in localStorage, not here. Bump VERSION when the app files change.
const VERSION = "ikhtiar-v1";
const FILES = ["./", "index.html", "app.css", "data.js", "store.js", "labs.js", "chart.js", "sound.js", "core.js", "app.js",
  "view-home.js", "view-checkin.js", "view-plan.js", "view-labs.js", "view-more.js", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Show the saved copy straight away, and quietly fetch a fresh one for next time.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || (req.mode === "navigate" ? cache.match("index.html") : Response.error());
  }));
});
