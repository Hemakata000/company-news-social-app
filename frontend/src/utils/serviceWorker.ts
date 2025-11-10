// Service Worker registration and management utilities

interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private config: ServiceWorkerConfig = {};

  constructor(config: ServiceWorkerConfig = {}) {
    this.config = config;
  }

  // Register service worker
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.registration = registration;

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              this.config.onUpdate?.(registration);
            }
          });
        }
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute

      console.log('Service Worker registered successfully');
      this.config.onSuccess?.(registration);
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      this.config.onError?.(error as Error);
      return null;
    }
  }

  // Unregister service worker
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('Service Worker unregistered');
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  // Update service worker
  async update(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      await this.registration.update();
      console.log('Service Worker update check completed');
    } catch (error) {
      console.error('Service Worker update failed:', error);
    }
  }

  // Skip waiting and activate new service worker
  async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      return;
    }

    // Send message to service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Reload page after activation
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  // Get cache statistics
  async getCacheStats(): Promise<any> {
    if (!('caches' in window)) {
      return null;
    }

    try {
      const cacheNames = await caches.keys();
      const stats = await Promise.all(
        cacheNames.map(async (name) => {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          return {
            name,
            size: keys.length
          };
        })
      );

      return {
        totalCaches: cacheNames.length,
        caches: stats,
        totalEntries: stats.reduce((sum, cache) => sum + cache.size, 0)
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }

  // Clear all caches
  async clearCaches(): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('All caches cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear caches:', error);
      return false;
    }
  }

  // Send message to service worker
  async sendMessage(message: any): Promise<void> {
    if (!this.registration || !this.registration.active) {
      return;
    }

    this.registration.active.postMessage(message);
  }

  // Request cache cleanup
  async requestCacheCleanup(): Promise<void> {
    await this.sendMessage({ type: 'CLEANUP_CACHE' });
  }

  // Check if app is running offline
  isOffline(): boolean {
    return !navigator.onLine;
  }

  // Get registration status
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager({
  onUpdate: (registration) => {
    // Show update notification to user
    const event = new CustomEvent('sw-update-available', { detail: registration });
    window.dispatchEvent(event);
  },
  onSuccess: (registration) => {
    console.log('Service Worker is ready');
    const event = new CustomEvent('sw-ready', { detail: registration });
    window.dispatchEvent(event);
  },
  onError: (error) => {
    console.error('Service Worker error:', error);
    const event = new CustomEvent('sw-error', { detail: error });
    window.dispatchEvent(event);
  }
});

// Auto-register service worker
export async function registerServiceWorker(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    await serviceWorkerManager.register();
  }
}



// Cache-first fetch utility
export async function fetchWithCache(
  url: string, 
  options: RequestInit = {},
  cacheFirst: boolean = false
): Promise<Response> {
  if (!('caches' in window)) {
    return fetch(url, options);
  }

  const request = new Request(url, options);
  const cache = await caches.open('api-v1');

  if (cacheFirst) {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET') {
      // Cache successful GET requests
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Preload critical resources
export async function preloadCriticalResources(urls: string[]): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  const cache = await caches.open('static-v1');
  
  const preloadPromises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.warn(`Failed to preload ${url}:`, error);
    }
  });

  await Promise.allSettled(preloadPromises);
  console.log('Critical resources preloaded');
}