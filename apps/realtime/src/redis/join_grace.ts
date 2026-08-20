import logger from '#logger';
import { ejectBothParticipantsFromRoom } from '../daily/room_service';
import { getRedisClient } from './singleton';
import { onKeyExpired } from './expiry_subscriber';

const JOIN_GRACE_MS = 60_000;

const LOCK_TTL_MS = 5_000;

const DATA_PREFIX = 'joingrace';
const TTL_PREFIX = 'joingrace-ttl';
const JOINED_PREFIX = 'joingrace-joined';
const LOCK_PREFIX = 'joingrace-lock';

function dataKey(roomName: string): string {
  return `${DATA_PREFIX}:${roomName}`;
}

function ttlKey(roomName: string): string {
  return `${TTL_PREFIX}:${roomName}`;
}

function joinedKey(roomName: string): string {
  return `${JOINED_PREFIX}:${roomName}`;
}

function lockKey(roomName: string): string {
  return `${LOCK_PREFIX}:${roomName}`;
}

export async function markJoined(roomName: string): Promise<void> {
  const redis = getRedisClient();

  if (!(await redis.exists(dataKey(roomName)))) return;

  await redis.sadd(joinedKey(roomName), 'member');
  await redis.pexpire(joinedKey(roomName), JOIN_GRACE_MS + LOCK_TTL_MS);

  const claimed = await redis.set(lockKey(roomName), '1', 'PX', LOCK_TTL_MS, 'NX');
  if (claimed !== 'OK') return;

  await redis.del(ttlKey(roomName), joinedKey(roomName));
}

async function handleJoinGraceTimeout(roomName: string): Promise<void> {
  const redis = getRedisClient();

  const claimed = await redis.set(lockKey(roomName), '1', 'PX', LOCK_TTL_MS, 'NX');
  if (claimed !== 'OK') return;

  const [raw, joined] = await Promise.all([redis.getdel(dataKey(roomName)), redis.smembers(joinedKey(roomName))]);
  await redis.del(joinedKey(roomName));
  if (!raw) return;

  // ejectBothParticipantsFromRoom(record.roomName, userIds).catch((err) =>
  //   logger.warn(err, 'failed to eject participants from expired daily room'),
  // );
}

export function registerJoinGraceExpiry(): void {
  onKeyExpired(TTL_PREFIX, (roomName) => {
    handleJoinGraceTimeout(roomName).catch((err) => logger.error(err, 'failed to handle join grace timeout'));
  });
}
