const CACHE_NAME = 'control-horario-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/manifest.json',
    '/favicon.ico',
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
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(async (error) => {
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
                return cachedResponse;
            }
            // Retorna un error de red válido en vez de undefined, evitando que pete Next.js (RSC payloads)
            return Response.error();
        })
    );
});
