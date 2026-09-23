/* ═══════════════════════════════════════════════════════════════
   sw.js — TimeTracker (Pre-cache Tesseract ngầm)
   ═══════════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'v4.3.0';
const CACHE_NAME = `timetracker-${CACHE_VERSION}`;

// ═══ File cần cache ngay (nhẹ) ═══
const CORE_ASSETS = [
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
    './manifest.json'
];

// ═══ File Tesseract cần cache ngầm (nặng, tải sau) ═══
const TESSERACT_ASSETS = [
    'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
    'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
    'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.0/tesseract-core.wasm.js',
    'https://cdn.jsdelivr.net/npm/tesseract.js-data@5.0.0/vie/vie.traineddata.gz'
];

// ═══ INSTALL: Cache ngay file nhẹ + tải ngầm Tesseract ═══
self.addEventListener('install', event => {
    console.log('📦 SW Install:', CACHE_VERSION);
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            // 1. Cache file nhẹ ngay
            try {
                await cache.addAll(CORE_ASSETS);
                console.log('✅ Core assets cached');
            } catch (err) {
                console.warn('Core cache fail:', err);
            }

            // 2. Tải ngầm Tesseract (không block install)
            tesseractPreCache(cache);
        })
    );
    self.skipWaiting();
});

// ═══ Hàm tải ngầm Tesseract từng file một ═══
async function tesseractPreCache(cache) {
    console.log('🔄 Bắt đầu tải ngầm Tesseract...');
    for (const url of TESSERACT_ASSETS) {
        try {
            const existing = await cache.match(url);
            if (existing) {
                console.log('📦 Đã có:', url.split('/').pop());
                continue;
            }
            console.log('⬇️ Đang tải:', url.split('/').pop());
            const response = await fetch(url, { mode: 'cors' });
            if (response && response.status === 200) {
                await cache.put(url, response);
                console.log('✅ Đã cache:', url.split('/').pop());
            }
        } catch (err) {
            console.warn('⚠️ Không tải được:', url, err);
        }
    }
    console.log('🎉 Tesseract pre-cache xong!');
}

// ═══ ACTIVATE: Xóa cache cũ ═══
self.addEventListener('activate', event => {
    console.log('🗑️ SW Activate:', CACHE_VERSION);
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// ═══ FETCH ═══
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    const isSameOrigin = url.origin === location.origin;
    const isCDN = url.hostname.includes('jsdelivr.net') ||
                  url.hostname.includes('cloudflare.com') ||
                  url.hostname.includes('googleapis.com') ||
                  url.hostname.includes('gstatic.com') ||
                  url.hostname.includes('projectnaptha.com');

    if (!isSameOrigin && !isCDN) return;

    // HTML: network first
    if (event.request.mode === 'navigate' ||
        event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // File nặng / CDN: CACHE FIRST
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
        fetch(event.request)
            .then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// ═══ Message từ app ═══
self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();

    // App có thể yêu cầu tải ngầm lại
    if (event.data === 'PRECACHE_TESSERACT') {
        caches.open(CACHE_NAME).then(cache => tesseractPreCache(cache));
    }
});