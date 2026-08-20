import { REDIS_KEYS, OnlineUser } from '@repo/shared-types';
import { getRedisClient } from '../redis/singleton';
import { broadcastOnlineUserDelta } from '../websocket/broadcast_online_user_delta';

const ONLINE_USER_PREFIX = REDIS_KEYS.ONLINE_USER_PREFIX;

const TTL_SECONDS = 300;

export const getOnlineUser = async (userId: string): Promise<OnlineUser | null> => {
    const raw = await getRedisClient().get(`${ONLINE_USER_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as OnlineUser) : null;
};

export const setOnlineUser = async (user: OnlineUser, patch: Partial<OnlineUser>): Promise<void> => {
    await getRedisClient().set(`${ONLINE_USER_PREFIX}${user.id}`, JSON.stringify({ ...user, ...patch }), 'EX', TTL_SECONDS);
};

export const patchOnlineUserIfPresent = async (userId: string, patch: Partial<OnlineUser>): Promise<void> => {
    const user = await getOnlineUser(userId);
    if (!user) return;
    await setOnlineUser(user, patch);
    if (patch.status) broadcastOnlineUserDelta({ type: 'update-status', onlineUserId: userId, status: patch.status });
};

export const addOnlineUser = async (user: OnlineUser): Promise<OnlineUser> => {
    const existing = await getOnlineUser(user.id);
    const toStore: OnlineUser = {
        ...user,
        status: existing?.status ?? user.status,
    };
    await getRedisClient().set(`${ONLINE_USER_PREFIX}${user.id}`, JSON.stringify(toStore), 'EX', TTL_SECONDS);
    broadcastOnlineUserDelta({ type: 'upsert', onlineUser: toStore });
    return toStore;
};

export const removeOnlineUser = async (userId: string): Promise<void> => {
    await getRedisClient().del(`${ONLINE_USER_PREFIX}${userId}`);
    broadcastOnlineUserDelta({ type: 'remove', onlineUserId: userId });
};

export const touchOnlineUserPresence = async (userId: string): Promise<boolean> => {
    const touched = await getRedisClient().expire(`${ONLINE_USER_PREFIX}${userId}`, TTL_SECONDS);
    return touched === 1;
};

export const clearOnlineUserList = async (): Promise<void> => {
    const redis = getRedisClient();
    const keys = await redis.keys(`${ONLINE_USER_PREFIX}*`);
    if (keys.length > 0) await redis.del(...keys);
};

export const getOnlineUserList = async (): Promise<OnlineUser[]> => {
    const redis = getRedisClient();
    const keys = await redis.keys(`${ONLINE_USER_PREFIX}*`);
    if (keys.length === 0) return [];
    const values = await redis.mget(...keys);
    return values.filter((v): v is string => v !== null).map((v) => JSON.parse(v));
};
