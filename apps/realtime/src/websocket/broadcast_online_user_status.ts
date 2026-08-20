import { SOCKET_OPEN, OnlineUser, WsServerMessage } from '@repo/shared-types';

import * as roomSocketRegistry from './room_socket_registry';


export function broadcastOnlineUserStatusInRoom(roomId: string, onlineUserId: string, status: OnlineUser['status']): void {
  const message: WsServerMessage = { event: 'online-user:delta', delta: { type: 'update-status', onlineUserId, status } };
  const payload = JSON.stringify(message);

  for (const socket of roomSocketRegistry.get(roomId)) {
    if (socket.readyState === SOCKET_OPEN) {
      socket.send(payload);
    }
  }
}
