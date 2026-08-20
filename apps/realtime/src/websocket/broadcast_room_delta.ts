import { SOCKET_OPEN, RoomListEvent, WsServerMessage } from '@repo/shared-types';

import { clientRegistry } from './client_registry';

export function broadcastRoomDelta(delta: RoomListEvent): void {
  const message: WsServerMessage = { event: 'room:delta', delta };
  const payload = JSON.stringify(message);

  for (const socket of clientRegistry) {
    if (socket.readyState === SOCKET_OPEN) {
      socket.send(payload);
    }
  }
}
