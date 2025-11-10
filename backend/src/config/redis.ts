// Disabled Redis for MVP - using in-memory cache instead
// This file is kept for compatibility but doesn't actually use Redis

export const initRedis = async (): Promise<any> => {
  console.log('ℹ️  Redis disabled - using in-memory cache');
  return null;
};

export const getRedisClient = (): any => {
  throw new Error('Redis is disabled for MVP. Use simpleCache instead.');
};

export const testRedisConnection = async (): Promise<boolean> => {
  console.log('ℹ️  Redis disabled - using in-memory cache');
  return true;
};

export const checkRedisHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
}> => {
  return { status: 'healthy' };
};

export const warmRedisCache = async (): Promise<void> => {
  // No-op
};

export const closeRedis = async (): Promise<void> => {
  // No-op
};
