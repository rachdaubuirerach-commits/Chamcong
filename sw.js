/* ═══════════════════════════════════════════════════════════════
   sw.js — Service Worker cho TimeTracker
   Tự động cập nhật khi có version mới
   ═══════════════════════════════════════════════════════════════ */

// ⚠️ ĐỔI SỐ NÀY MỖI LẦN UPDATE
const CACHE_VERSION = 'v4.1.2';
const CACHE_NAME = `timetracker-${CACHE_VERSION}`;

// Files cần cache
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './style-effects.css',
    './script.js',
    './image-export.js',
    './effects.js',
    './lunar-engine.js',
    './holiday-data.js',
    './holiday-resolver.js'
];

// ═══ INSTALL: Cache files ═══
self.addEventListener('install', event => {
    console.log('📦 SW Install:', CACHE_VERSION);
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS).catch(err => {
                console.warn('Cache partial fail:', err);
            });
        })
    );
    // Kích hoạt ngay
    self.skipWaiting();
});

// ═══ ACTIVATE: Xóa cache cũ ═══
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

// ═══ FETCH: Network first, cache fallback ═══
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    
    const url = new URL(event.request.url);
    // Chỉ xử lý files cùng domain
    if (url.origin !== location.origin) return;

    // HTML: LUÔN tải mới (tránh cache dai iOS)
    if (event.request.mode === 'navigate' || 
        event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // JS/CSS: Network first
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// ═══ MESSAGE từ app ═══
self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
