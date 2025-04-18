// Service Worker Version
const CACHE_VERSION = 'v1';
const CACHE_NAME = `bondquest-cache-${CACHE_VERSION}`;

// Assets to cache immediately on installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service worker precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('Service worker: clearing old cache', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests differently (network-first)
  if (event.request.url.includes('/api/')) {
    return networkFirstStrategy(event);
  }

  // For non-API requests, use cache-first strategy
  event.respondWith(
    cacheFirstStrategy(event)
      .catch(() => {
        // If both cache and network fail, serve offline page for navigation requests
        return caches.match('/offline.html');
      })
  );
});

// Cache-first strategy
async function cacheFirstStrategy(event) {
  const cachedResponse = await caches.match(event.request);
  
  if (cachedResponse) {
    // Return cached response
    return cachedResponse;
  }
  
  // If not in cache, fetch from network and cache if successful
  return fetchAndCache(event.request);
}

// Network-first strategy for API requests
async function networkFirstStrategy(event) {
  try {
    // Try network first
    const response = await fetchAndCache(event.request);
    return response;
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, rethrow the error
    throw error;
  }
}

// Helper to fetch from network and cache the response
async function fetchAndCache(request) {
  const response = await fetch(request);
  
  // Only cache valid responses for GET requests
  if (response.ok && request.method === 'GET') {
    // Clone the response as it can only be used once
    const responseToCache = response.clone();
    
    // Cache the response
    caches.open(CACHE_NAME)
      .then((cache) => {
        cache.put(request, responseToCache);
      });
  }
  
  return response;
}

// Handle background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncFormData());
  }
});

// Helper function to sync stored form data
async function syncFormData() {
  // Implementation will depend on how we store offline form data
  // This is a placeholder for future implementation
  console.log('Service worker: syncing offline data');
}

// Push notification event handler
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body || 'Something new in BondQuest!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'BondQuest', options)
  );
});

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        const url = event.notification.data.url;
        
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});