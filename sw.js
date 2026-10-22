const CACHE = 'timetracker-v4.0.4';
const ASSETS = [
  './', './index.html', './style.css', './style-effects.css', './app.js',
  './effects.js', './image-export.js', './ocr-compare.js',
  './lunar-engine.js', './holiday-data.js', './holiday-resolver.js',
  './manifest.json'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isCDN = url.hostname.includes('jsdelivr.net') || url.hostname.includes('cloudflare.com');
  if (url.origin !== location.origin && !isCDN) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('./index.html')));
    return;
  }
  const isHeavy = /\.(wasm|traineddata|gz)$/i.test(url.pathname);
  if (isHeavy) {
    e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).then(res => {
      if (res.ok) caches.open(CACHE).then(cc => cc.put(e.request, res.clone()));
      return res;
    })));
    return;
  }
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).then(res => {
    if (res.ok) caches.open(CACHE).then(cc => cc.put(e.request, res.clone()));
    return res;
  })));
});