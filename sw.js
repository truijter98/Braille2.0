/* Service worker: maakt de app offline bruikbaar. Verhoog VERSION bij elke nieuwe versie. */
const VERSION = 'braille-v1';
const APP_FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== 'braille-models').map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Handmodel (MediaPipe) van de CDN: na eerste download bewaren, zodat gebaren ook offline werken
  if (/cdn\.jsdelivr\.net|unpkg\.com/.test(url.host)) {
    e.respondWith(caches.open('braille-models').then(async (c) => {
      const hit = await c.match(e.request); if (hit) return hit;
      const res = await fetch(e.request); if (res.ok) c.put(e.request, res.clone()); return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // Eigen bestanden: netwerk eerst (nieuwe versie), anders cache (offline)
  e.respondWith(fetch(e.request).then((res) => { if (res.ok) caches.open(VERSION).then((c) => c.put(e.request, res.clone())); return res; })
    .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html'))));
});
