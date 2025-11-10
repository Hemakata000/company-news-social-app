// Service Worker for Company News Social App
// Provides offline functionality and advanced caching strategies

const CACHE_NAME = 'company-news-app-v1';
const STATIC_CACHE_NAME = 'static-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-v1';
const API_CACHE_NAME = 'api-v1';

// Cache duration in milliseconds
const CACHE_DURATION = {
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days
  API: 15 * 60 * 1000, // 15 minutes
  DYNAMIC: 24 * 60 * 60 * 1000, // 24 hours
};

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints that should be cached
const CACHEABLE_API_PATTERNS = [
  /\/api\/news\/.+/,
  /\/api\/content\/generate/,
  /\/api\/news\/search\/companies/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== API_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Check if request is for a static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/static/') || 
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.ico') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.svg');
}

// Check if request is for API
function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

// Check if API endpoint should be cached
function isCacheableAPI(request) {
  const url = new URL(request.url);
  return CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cache is still fresh
      const cacheDate = new Date(cachedResponse.headers.get('date') || 0);
      const now = new Date();
      
      if (now - cacheDate < CACHE_DURATION.STATIC) {
        return cachedResponse;
      }
    }
    
    // Fetch fresh version
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Static asset fetch failed', error);
    
    // Return cached version if available
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page or error response
    return new Response('Offline', { status: 503 });
  }
}

// Handle API requests with stale-while-revalidate strategy
async function handleAPIRequest(request) {
  if (!isCacheableAPI(request)) {
    // Don't cache non-cacheable API requests
    return fetch(request);
  }

  try {
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Always try to fetch fresh data
    const networkPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone();
        await cache.put(request, responseClone);
      }
      return networkResponse;
    });
    
    // If we have cached data, return it immediately and update in background
    if (cachedResponse) {
      const cacheDate = new Date(cachedResponse.headers.get('date') || 0);
      const now = new Date();
      
      // If cache is fresh enough, return it and update in background
      if (now - cacheDate < CACHE_DURATION.API) {
        // Update cache in background
        networkPromise.catch(error => {
          console.warn('Service Worker: Background API update failed', error);
        });
        
        return cachedResponse;
      }
    }
    
    // Wait for network response
    try {
      return await networkPromise;
    } catch (networkError) {
      // Network failed, return cached version if available
      if (cachedResponse) {
        console.log('Service Worker: Returning stale API data due to network error');
        return cachedResponse;
      }
      throw networkError;
    }
  } catch (error) {
    console.error('Service Worker: API request failed', error);
    return new Response(JSON.stringify({ 
      error: 'Offline', 
      message: 'Unable to fetch data while offline' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle dynamic requests with network-first strategy
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache');
    
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-message { color: #666; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>You're offline</h1>
            <p>Please check your internet connection and try again.</p>
          </div>
        </body>
      </html>
    `, {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('Service Worker: Performing background sync');
  
  // Retry failed API requests
  const cache = await caches.open(API_CACHE_NAME);
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
    } catch (error) {
      console.warn('Service Worker: Background sync failed for', request.url);
    }
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: data.tag || 'news-update',
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icon-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icon-dismiss.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'News Update', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Cache cleanup on storage pressure
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    event.waitUntil(cleanupOldCache());
  }
});

async function cleanupOldCache() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const cacheDate = new Date(response.headers.get('date') || 0);
        const now = new Date();
        
        // Remove entries older than 7 days
        if (now - cacheDate > 7 * 24 * 60 * 60 * 1000) {
          await cache.delete(request);
        }
      }
    }
  }
  
  console.log('Service Worker: Cache cleanup completed');
}