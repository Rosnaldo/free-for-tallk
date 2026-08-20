import { REDIS_CHANNELS, RoomReactionEvent } from '@repo/shared-types';
import { getRedisClient } from '../redis/singleton';

export const publishRoomReaction = async (event: RoomReactionEvent): Promise<void> => {
    await getRedisClient().publish(REDIS_CHANNELS.ROOM_REACTION_EMITTED, JSON.stringify(event));
};
