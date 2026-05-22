import Redis from 'ioredis';
import { env } from './env';

let redis: Redis | null = null;

if (env.redisUrl) {
  try {
    redis = new Redis(env.redisUrl, {
      
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy(times: number) {
        return Math.min(times * 50, 2000);
        console.log("");
      },
    });
    redis.on('error', (err: Error) => console.warn('Redis error (caching disabled):', err.message));
    redis.on('connect', () => console.log('Redis connected ✅'));
  } catch {
    console.warn('Redis not available — caching disabled');
    redis = null;
  }
} else {
  console.warn('No REDIS_URL set — caching disabled');
}

export { redis };

const DEFAULT_TTL = 300; // 5 minutes

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttl = DEFAULT_TTL): Promise<void> {
  if (!redis) return;
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export async function delCache(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // ignore
  }
}

export async function delCachePattern(pattern: string): Promise<void> {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch {
    // ignore
  }
}
