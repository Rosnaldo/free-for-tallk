import { SOCKET_OPEN, RoomNoticeEvent, WsServerMessage } from '@repo/shared-types';

import * as roomSocketRegistry from './room_socket_registry';

// Only that room's members need to see a join/leave notice -- looked up via
// roomSocketRegistry, same as broadcastRoomReaction.
export function broadcastRoomNotice(event: RoomNoticeEvent): void {
  const message: WsServerMessage = { event: 'room:notice', ...event };
  const payload = JSON.stringify(message);

  for (const socket of roomSocketRegistry.get(event.roomId)) {
    if (socket.readyState === SOCKET_OPEN) {
      socket.send(payload);
    }
  }
}
