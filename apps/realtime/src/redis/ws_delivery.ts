import { REDIS_CHANNELS, WsServerMessage } from '@repo/shared-types';
import logger from '#logger';
import { getRedisClient } from './singleton';


export function deliverToOnlineUser(onlineUserId: string, message: WsServerMessage): void {
  getRedisClient()
    .publish(REDIS_CHANNELS.ONLINE_USER_WS_DELIVER, JSON.stringify({ id: onlineUserId, message }))
    .catch((err) => logger.error(err, 'failed to publish onlineUser ws delivery'));
}
