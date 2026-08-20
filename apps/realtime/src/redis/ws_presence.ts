import { getRedisClient } from './singleton';

const PREFIX = 'ws-online';
const TTL_SECONDS = 300;


function keyFor(id: string): string {
  return `${PREFIX}:${id}`;
}

export async function markConnected(id: string, connId: string): Promise<void> {
  const redis = getRedisClient();
  await redis.sadd(keyFor(id), connId);
  await redis.expire(keyFor(id), TTL_SECONDS);
}

// No harm in calling this even if connId was never added (e.g. the online
// key already expired) -- SREM on a missing member/key is just a no-op.
export async function markDisconnected(id: string, connId: string): Promise<void> {
  await getRedisClient().srem(keyFor(id), connId);
}

export async function touchConnected(id: string): Promise<void> {
  await getRedisClient().expire(keyFor(id), TTL_SECONDS);
}

export async function isConnected(id: string): Promise<boolean> {
  const count = await getRedisClient().scard(keyFor(id));
  return count > 0;
}
