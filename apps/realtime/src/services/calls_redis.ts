import { getRedisClient } from '../redis/singleton';

const ROOMS_KEY = 'daily_rooms';

export const trackRoom = async (roomName: string): Promise<void> => {
    await getRedisClient().sadd(ROOMS_KEY, roomName);
};

export const listAndClearTrackedRooms = async (): Promise<string[]> => {
    const redis = getRedisClient();
    const rooms = await redis.smembers(ROOMS_KEY);
    if (rooms.length) await redis.del(ROOMS_KEY);
    return rooms;
};
