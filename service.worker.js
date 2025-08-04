const CACHE_NAME = 'abn-attendance-cache-v1'; // Cache version
const urlsToCache = [
    './', // Caches the root (index.html)
    './index.html',
    './assets/abnlogo.png',
    './assets/apple-touch-icon.png',
    './assets/favicon-32x32.png',
    './assets/favicon-16x16.png',
    './assets/favicon.ico',
    'https://cdn.tailwindcss.com', // Tailwind CSS CDN
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap', // Google Fonts CSS
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2' // Supabase JS library
];

// Install event: Caches all necessary assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Failed to cache during install:', error);
            })
    );
});

// Fetch event: Serves cached content first, then tries network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // No cache hit - fetch from network
                return fetch(event.request).catch(error => {
                    // This catch is for network errors (e.g., offline)
                    console.error('Fetch failed:', error);
                    // You can return a custom offline page here if you have one
                    // return caches.match('/offline.html'); 
                });
            })
    );
});

// Activate event: Cleans up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // Delete old caches
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
