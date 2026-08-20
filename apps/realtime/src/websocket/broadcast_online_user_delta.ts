import { SOCKET_OPEN, OnlineUserListEvent, WsServerMessage } from '@repo/shared-types';

import * as onlineUserRegistry from './user_registry';

export function broadcastOnlineUserDelta(delta: OnlineUserListEvent): void {
  const message: WsServerMessage = { event: 'online-user:delta', delta };
  const payload = JSON.stringify(message);

  for (const socket of onlineUserRegistry.all()) {
    if (socket.readyState === SOCKET_OPEN) {
      socket.send(payload);
    }
  }
}
