import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let client: RedisClientType;

export const connectRedis = async (): Promise<void> => {
  try {
    client = createClient({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
      password: process.env.REDIS_PASSWORD || undefined
    });

    client.on('error', (error) => {
      logger.error('Redis client error:', error);
    });

    client.on('connect', () => {
      logger.info('Redis client connected');
    });

    await client.connect();
    
    // Test connection
    await client.ping();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

export const getRedis = (): RedisClientType => {
  if (!client) {
    throw new Error('Redis not initialized. Call connectRedis() first.');
  }
  return client;
};

export const cacheSet = async (
  key: string, 
  value: any, 
  ttlSeconds: number = 3600
): Promise<void> => {
  try {
    await getRedis().setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    logger.error('Cache set error:', { key, error });
  }
};

export const cacheGet = async <T = any>(key: string): Promise<T | null> => {
  try {
    const value = await getRedis().get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Cache get error:', { key, error });
    return null;
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  try {
    await getRedis().del(key);
  } catch (error) {
    logger.error('Cache delete error:', { key, error });
  }
};

export const cacheInvalidatePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await getRedis().keys(pattern);
    if (keys.length > 0) {
      await getRedis().del(keys);
    }
  } catch (error) {
    logger.error('Cache invalidate pattern error:', { pattern, error });
  }
};