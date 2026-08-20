import { REDIS_CHANNELS, RoomDeviceStateEvent } from '@repo/shared-types';
import { getRedisClient } from '../redis/singleton';
import { patchOnlineUserIfPresent } from './online_list_redis';

export const publishRoomDeviceState = async (event: RoomDeviceStateEvent): Promise<void> => {
    // Persisted on the user's online-user record so it's already correct for
    // anyone who fetches the online user list after this (e.g. joining the
    // room later) -- patchOnlineUserIfPresent only broadcasts globally on a
    // status change, so this patch alone doesn't leak outside the room.
    await patchOnlineUserIfPresent(event.userId, { microphoneOn: event.microphoneOn, cameraOn: event.cameraOn });
    await getRedisClient().publish(REDIS_CHANNELS.ROOM_DEVICE_STATE_UPDATED, JSON.stringify(event));
};
