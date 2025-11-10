import { useState, useEffect, useCallback } from 'react';
import { serviceWorkerManager } from '../utils/serviceWorker';

// Hook for React components to use service worker
export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleUpdateAvailable = () => setUpdateAvailable(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sw-update-available', handleUpdateAvailable);

    // Load cache stats
    serviceWorkerManager.getCacheStats().then(setCacheStats);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  const updateApp = useCallback(async () => {
    await serviceWorkerManager.skipWaiting();
    setUpdateAvailable(false);
  }, []);

  const clearCache = useCallback(async () => {
    const success = await serviceWorkerManager.clearCaches();
    if (success) {
      const newStats = await serviceWorkerManager.getCacheStats();
      setCacheStats(newStats);
    }
    return success;
  }, []);

  const refreshCacheStats = useCallback(async () => {
    const stats = await serviceWorkerManager.getCacheStats();
    setCacheStats(stats);
  }, []);

  return {
    isOnline,
    updateAvailable,
    cacheStats,
    updateApp,
    clearCache,
    refreshCacheStats,
    isOffline: !isOnline
  };
}