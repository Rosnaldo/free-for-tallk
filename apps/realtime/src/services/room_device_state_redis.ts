import { REDIS_CHANNELS, RoomDeviceStateEvent } from '@repo/shared-types';
import { getRedisClient } from '../redis/singleton';
import { patchOnlineUserIfPresent } from './online_list_redis';

export const publishRoomDeviceState = async (event: RoomDeviceStateEvent): Promise<void> => {
    await patchOnlineUserIfPresent(event.userId, { microphoneOn: event.microphoneOn, cameraOn: event.cameraOn });
    await getRedisClient().publish(REDIS_CHANNELS.ROOM_DEVICE_STATE_UPDATED, JSON.stringify(event));
};
