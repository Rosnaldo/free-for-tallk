import { REDIS_CHANNELS, REDIS_KEYS, OnlineUser, OnlineUserListEvent } from '@repo/shared-types';

import { getRedisClient } from './connection';

// Read-only: api doesn't write these keys, realtime is the sole writer.
export async function getOnlineUserList(): Promise<OnlineUser[]> {
  const redis = getRedisClient();
  const keys = await redis.keys(`${REDIS_KEYS.ONLINE_USER_PREFIX}*`);
  if (keys.length === 0) return [];

  const values = await redis.mget(...keys);
  return values.filter((v): v is string => v !== null).map((v) => JSON.parse(v));
}

// api doesn't write the online-user:* keys directly -- this only publishes a
// patch for realtime to apply (if the user is online) and relay to the web.
export async function publishOnlineUserPatch(onlineUserId: string, patch: Partial<OnlineUser>): Promise<void> {
  const event: OnlineUserListEvent = { type: 'patch', onlineUserId, patch };
  await getRedisClient().publish(REDIS_CHANNELS.ONLINE_USER_LIST_UPDATED, JSON.stringify(event));
}
