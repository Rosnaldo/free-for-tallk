import { REDIS_KEYS, IRoom } from '@repo/shared-types';

import { getRedisClient } from './connection';

// Read-only: api doesn't write these keys, realtime is the sole writer.
export async function getRoomList(): Promise<IRoom[]> {
  const redis = getRedisClient();
  const keys = await redis.keys(`${REDIS_KEYS.ROOM_PREFIX}*`);
  if (keys.length === 0) return [];

  const values = await redis.mget(...keys);
  return values.filter((v): v is string => v !== null).map((v) => JSON.parse(v));
}
