import { REDIS_CHANNELS, RoomNoticeEvent } from '@repo/shared-types';
import { getRedisClient } from '../redis/singleton';

export const publishRoomNotice = async (event: RoomNoticeEvent): Promise<void> => {
    await getRedisClient().publish(REDIS_CHANNELS.ROOM_NOTICE_EMITTED, JSON.stringify(event));
};
