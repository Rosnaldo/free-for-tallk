import { randomUUID } from 'crypto';
import { REDIS_CHANNELS, REDIS_KEYS, IRoom, RoomListEvent } from '@repo/shared-types';
import { getRedisClient } from '../redis/singleton';

const ROOM_PREFIX = REDIS_KEYS.ROOM_PREFIX;
const USER_ROOM_PREFIX = REDIS_KEYS.USER_ROOM_PREFIX;

type JoinResult = { ok: true; room: IRoom; alreadyMember: boolean } | { ok: false; reason: 'not_found' | 'full' };

const publishRoomEvent = async (event: RoomListEvent): Promise<void> => {
    await getRedisClient().publish(REDIS_CHANNELS.ROOM_LIST_UPDATED, JSON.stringify(event));
};

export const getRoom = async (roomId: string): Promise<IRoom | null> => {
    const raw = await getRedisClient().get(`${ROOM_PREFIX}${roomId}`);
    return raw ? (JSON.parse(raw) as IRoom) : null;
};

const setRoom = async (room: IRoom): Promise<void> => {
    await getRedisClient().set(`${ROOM_PREFIX}${room.id}`, JSON.stringify(room));
};

export const createRoom = async (input: {
    title: string;
    subtitle?: string;
    maxSlots: number;
    creatorId: string;
}): Promise<IRoom> => {
    const room: IRoom = {
        id: randomUUID(),
        title: input.title,
        subtitle: input.subtitle,
        maxSlots: input.maxSlots,
        creator: input.creatorId,
        members: [input.creatorId],
    };
    await setRoom(room);
    await publishRoomEvent({ type: 'created', room });
    return room;
};

export const deleteRoom = async (roomId: string): Promise<void> => {
    await getRedisClient().del(`${ROOM_PREFIX}${roomId}`);
    await publishRoomEvent({ type: 'deleted', roomId });
};

export const addMemberToRoom = async (roomId: string, userId: string): Promise<JoinResult> => {
    const room = await getRoom(roomId);
    if (!room) return { ok: false, reason: 'not_found' };
    if (room.members.includes(userId)) return { ok: true, room, alreadyMember: true };
    if (room.members.length >= room.maxSlots) return { ok: false, reason: 'full' };

    const updated: IRoom = { ...room, members: [...room.members, userId] };
    await setRoom(updated);
    await publishRoomEvent({ type: 'member-added', roomId, userId });
    return { ok: true, room: updated, alreadyMember: false };
};

// Returns whether the user was actually removed, so callers (e.g. a leave
// notice) can skip firing for a no-op call -- room:leave and the on-close
// orphan cleanup can both race to call this for the same disconnect.
export const removeMemberFromRoom = async (roomId: string, userId: string): Promise<boolean> => {
    const room = await getRoom(roomId);
    if (!room) return false;

    const remaining = room.members.filter((id) => id !== userId);
    if (remaining.length === room.members.length) return false; // wasn't a member, nothing changed

    if (remaining.length === 0) {
        await deleteRoom(roomId);
        return true;
    }

    await setRoom({ ...room, members: remaining });
    await publishRoomEvent({ type: 'member-removed', roomId, userId });
    return true;
};

// See USER_ROOM_PREFIX -- lets a reconnecting socket re-heal its
// roomSocketRegistry entry without needing the client to resend room:join.
export const setUserRoom = async (userId: string, roomId: string): Promise<void> => {
    await getRedisClient().set(`${USER_ROOM_PREFIX}${userId}`, roomId);
};

export const getUserRoom = async (userId: string): Promise<string | null> => {
    return getRedisClient().get(`${USER_ROOM_PREFIX}${userId}`);
};

export const clearUserRoom = async (userId: string): Promise<void> => {
    await getRedisClient().del(`${USER_ROOM_PREFIX}${userId}`);
};
