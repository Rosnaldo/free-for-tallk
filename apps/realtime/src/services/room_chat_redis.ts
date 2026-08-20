import { REDIS_CHANNELS, RoomChatEvent } from '@repo/shared-types';
import { getRedisClient } from '../redis/singleton';

export const publishRoomChat = async (event: RoomChatEvent): Promise<void> => {
    await getRedisClient().publish(REDIS_CHANNELS.ROOM_CHAT_EMITTED, JSON.stringify(event));
};
