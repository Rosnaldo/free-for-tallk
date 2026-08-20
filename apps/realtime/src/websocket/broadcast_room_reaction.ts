import { SOCKET_OPEN, RoomReactionEvent, WsServerMessage } from '@repo/shared-types';

import * as roomSocketRegistry from './room_socket_registry';

// Unlike broadcastRoomDelta (relevant to every connected client, since the
// room list view is global), a reaction only matters to sockets whose user
// is currently a member of that specific room -- looked up via
// roomSocketRegistry rather than iterating every connected client.
export function broadcastRoomReaction(event: RoomReactionEvent): void {
  const message: WsServerMessage = { event: 'room:reaction', ...event };
  const payload = JSON.stringify(message);

  for (const socket of roomSocketRegistry.get(event.roomId)) {
    if (socket.readyState === SOCKET_OPEN) {
      socket.send(payload);
    }
  }
}
