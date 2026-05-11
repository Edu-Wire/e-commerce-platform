import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

async function flush() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log('No REDIS_URL found');
    return;
  }
  const redis = new Redis(redisUrl);
  await redis.flushall();
  console.log('Redis cache flushed successfully! ✅');
  process.exit(0);
}

flush();
