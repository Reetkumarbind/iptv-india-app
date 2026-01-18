const CACHE_NAME = 'reet-tv-v3';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.svg',
    '/favicon.ico'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Don't cache streams or fragments
    if (url.pathname.endsWith('.m3u8') || url.pathname.endsWith('.ts') || url.pathname.includes('/play/')) {
        return;
    }

    // Network-First for HTML and Manifest to avoid "hash mismatch" blank screens
    if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('manifest.json')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clonedResponse);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-First for assets (JS, CSS, Images) as they have unique hashes or are static
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                const clonedResponse = fetchResponse.clone();
                // Only cache successful responses and static assets
                if (fetchResponse.ok && (url.pathname.includes('/assets/') || url.pathname.includes('/public/'))) {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clonedResponse);
                    });
                }
                return fetchResponse;
            });
        })
    );
});
