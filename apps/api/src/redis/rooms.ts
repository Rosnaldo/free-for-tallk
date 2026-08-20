import { randomUUID } from 'crypto';
import { REDIS_CHANNELS, REDIS_KEYS, IRoom, RoomListEvent } from '@repo/shared-types';

import { getRedisClient } from './connection';

const ROOM_PREFIX = REDIS_KEYS.ROOM_PREFIX;

export async function getRoomList(): Promise<IRoom[]> {
  const redis = getRedisClient();
  const keys = await redis.keys(`${ROOM_PREFIX}*`);
  if (keys.length === 0) return [];

  const values = await redis.mget(...keys);
  return values.filter((v): v is string => v !== null).map((v) => JSON.parse(v));
}

export async function getRoom(roomId: string): Promise<IRoom | null> {
  const raw = await getRedisClient().get(`${ROOM_PREFIX}${roomId}`);
  return raw ? (JSON.parse(raw) as IRoom) : null;
}

const publishRoomEvent = async (event: RoomListEvent): Promise<void> => {
  await getRedisClient().publish(REDIS_CHANNELS.ROOM_LIST_UPDATED, JSON.stringify(event));
};

export async function createRoom(input: {
  title: string;
  subtitle?: string;
  maxSlots: number;
  creatorId: string;
}): Promise<IRoom> {
  const room: IRoom = {
    id: randomUUID(),
    title: input.title,
    subtitle: input.subtitle,
    maxSlots: input.maxSlots,
    creator: input.creatorId,
    members: [input.creatorId],
  };
  await getRedisClient().set(`${ROOM_PREFIX}${room.id}`, JSON.stringify(room));
  await publishRoomEvent({ type: 'created', room });
  return room;
}

export async function deleteRoom(roomId: string): Promise<void> {
  await getRedisClient().del(`${ROOM_PREFIX}${roomId}`);
  await publishRoomEvent({ type: 'deleted', roomId });
}
