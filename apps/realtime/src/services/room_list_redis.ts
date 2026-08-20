import { randomUUID } from 'crypto';
import { REDIS_CHANNELS, REDIS_KEYS, IRoom, RoomListEvent } from '@repo/shared-types';
import { getRedisClient } from '../redis/singleton';

const ROOM_PREFIX = REDIS_KEYS.ROOM_PREFIX;

type JoinResult = { ok: true; room: IRoom } | { ok: false; reason: 'not_found' | 'full' };

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
    if (room.members.includes(userId)) return { ok: true, room };
    if (room.members.length >= room.maxSlots) return { ok: false, reason: 'full' };

    const updated: IRoom = { ...room, members: [...room.members, userId] };
    await setRoom(updated);
    await publishRoomEvent({ type: 'member-added', roomId, userId });
    return { ok: true, room: updated };
};

export const removeMemberFromRoom = async (roomId: string, userId: string): Promise<void> => {
    const room = await getRoom(roomId);
    if (!room) return;

    const remaining = room.members.filter((id) => id !== userId);
    if (remaining.length === room.members.length) return; // wasn't a member, nothing changed

    if (remaining.length === 0) {
        await deleteRoom(roomId);
        return;
    }

    await setRoom({ ...room, members: remaining });
    await publishRoomEvent({ type: 'member-removed', roomId, userId });
};
