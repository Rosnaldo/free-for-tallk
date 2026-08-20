import { SOCKET_OPEN, RoomChatEvent, WsServerMessage } from '@repo/shared-types';

import * as roomSocketRegistry from './room_socket_registry';

// Only that room's members need to see a chat message -- looked up via
// roomSocketRegistry, same as broadcastRoomReaction.
export function broadcastRoomChat(event: RoomChatEvent): void {
  const message: WsServerMessage = { event: 'room:chat', ...event };
  const payload = JSON.stringify(message);

  for (const socket of roomSocketRegistry.get(event.roomId)) {
    if (socket.readyState === SOCKET_OPEN) {
      socket.send(payload);
    }
  }
}
