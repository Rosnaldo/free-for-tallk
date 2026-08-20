import Redis from 'ioredis';

import properties from '../properties';
import logger from '../logger';

let client: Redis | undefined;

export async function connectRedis(): Promise<void> {
  client = new Redis(properties.redisUrl, { lazyConnect: true });

  client.on('error', (err) => {
    logger.error(err, 'redis connection error');
  });

  await client.connect();
  logger.info('redis connected');
}

export function getRedisClient(): Redis {
  if (!client) throw new Error('Redis client not initialized');
  return client;
}
