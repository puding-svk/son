const CACHE_NAME = 'accident-report-v1';
const ASSETS_TO_CACHE = [
  '/son/sprava_o_nehode_template.pdf',
  '/son/fonts/NimbusSanL-Bol.otf',
  '/son/impactMarker-background.png',
  '/son/applogo.svg',
];

// Install event: cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((error) => {
        console.warn('Failed to cache some assets:', error);
        // Don't fail installation if caching fails
        return Promise.resolve();
      });
    })
  );
});

// Activate event: clean up old caches
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
});

// Fetch event: serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Check if this is a resource we want to cache offline
  const shouldCacheOffline = 
    url.pathname.includes('sprava_o_nehode_template.pdf') || 
    url.pathname.includes('/fonts/') ||
    url.pathname.includes('impactMarker-background.png') ||
    url.pathname.includes('applogo.svg');
  
  if (shouldCacheOffline) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Return cached response if available
        if (response) {
          return response;
        }
        
        // Otherwise fetch from network and cache it
        return fetch(event.request).then((response) => {
          // Only cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        }).catch(() => {
          // If both cache and network fail, return a generic error response
          console.error('Failed to fetch:', event.request.url);
          return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        });
      })
    );
  }
});
