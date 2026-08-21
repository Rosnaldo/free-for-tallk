import { randomUUID } from 'crypto';
import { ISocket, IUser, WsClientMessage, WsServerMessage, mapUserToOnlineUser } from '@repo/shared-types';

import * as userRegistry from './user_registry';
import { addOnlineUser, removeOnlineUser } from '../services/online_list_redis';
import { startGracePeriod, cancelGracePeriod } from '../redis/grace_period';
import { markConnected, markDisconnected, touchConnected } from '../redis/ws_presence';
import { createHeartbeat } from './heartbeat';
import logger from '#logger';

export function onConnection(ws: ISocket & { isAlive: boolean }, userId: string, user?: IUser): void {
  const connId = randomUUID();

  const previousSocket = userRegistry.get(userId);
  userRegistry.set(userId, ws);
  markConnected(userId, connId).catch((err) => logger.error(err, 'failed to mark user connected'));

  if (previousSocket && previousSocket !== ws) previousSocket.terminate();

  const hb = createHeartbeat(ws, () => ws.terminate());
  ws.on('pong', () => {
    hb.beat();
    touchConnected(userId).catch((err) => logger.error(err, 'failed to refresh user ws presence'));
  });

  const presenceId = user?._id;

  if (presenceId) cancelGracePeriod(presenceId).catch((err) => logger.error(err, 'failed to cancel grace period'));

  if (presenceId && user) {
    const onlineUser = mapUserToOnlineUser(user, { id: presenceId });
    addOnlineUser(onlineUser).catch((err) => logger.error(err, 'failed to add user to redis list'));
  }

  ws.on('message', async (raw) => {
    let message: WsClientMessage;
    try {
      message = JSON.parse(raw.toString()) as WsClientMessage;
    } catch {
      return;
    }

    if (message.event === 'user_logout') {
      userRegistry.remove(userId);
      if (presenceId) {
        removeOnlineUser(presenceId)
          .catch((err) => logger.error(err, 'failed to remove user / record session'));
      }
      ws.terminate();
    }
  });

  ws.on('close', async () => {
    hb.stop();

    markDisconnected(userId, connId).catch((err) => logger.error(err, 'failed to mark user disconnected'));

    if (userRegistry.get(userId) !== ws) return;

    userRegistry.remove(userId);
    if (presenceId) {
      startGracePeriod(presenceId).catch((err) => logger.error(err, 'failed to start grace period'));
    }
  });
}
