/* ═══════════════════════════════════════════════════════════════
   sw.js — TimeTracker (Tesseract offline local)
   ═══════════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'v4.4.9';
const CACHE_NAME = `timetracker-${CACHE_VERSION}`;

const ASSETS = [
    './',
    './index.html',
    './style.css',
    './style-effects.css',
    './script.js',
    './ocr-compare.js',
    './image-export.js',
    './effects.js',
    './lunar-engine.js',
    './holiday-data.js',
    './holiday-resolver.js',
    './manifest.json',
    // ═══ Tesseract local ═══
    './tesseract/tesseract.min.js',
    './tesseract/worker.min.js',
    './tesseract/tesseract-core.wasm.js',
    './tesseract/tesseract-core-simd.wasm.js',
    './tesseract/tesseract-core-lstm.wasm.js',
    './tesseract/tesseract-core-simd-lstm.wasm.js',
    './tesseract/lang-data/vie.traineddata.gz',
    './tesseract/lang-data/chi_sim.traineddata.gz'
];

self.addEventListener('install', event => {
    console.log('📦 SW Install:', CACHE_VERSION);
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS).catch(err => {
                console.warn('Cache partial fail:', err);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('🗑️ SW Activate:', CACHE_VERSION);
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('🗑️ Delete cache:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Cho phép cả CDN heic2any
    const isCDN = url.hostname.includes('jsdelivr.net') ||
                  url.hostname.includes('cloudflare.com');
    const isSameOrigin = url.origin === location.origin;

    if (!isSameOrigin && !isCDN) return;

    // HTML: network first
    if (event.request.mode === 'navigate' ||
        event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request).then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            }).catch(() => caches.match(event.request))
        );
        return;
    }

    // File nặng (wasm, traineddata, gz) + CDN JS: cache first
    const isHeavy = /\.(wasm|traineddata|gz)$/i.test(url.pathname) ||
                    (isCDN && url.pathname.endsWith('.js'));

    if (isHeavy) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(response => {
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Còn lại: network first
    event.respondWith(
        fetch(event.request).then(response => {
            if (response && response.status === 200) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
        }).catch(() => caches.match(event.request))
    );
});

self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
