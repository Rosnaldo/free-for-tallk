import { SOCKET_OPEN, RoomDeviceStateEvent, WsServerMessage } from '@repo/shared-types';

import * as roomSocketRegistry from './room_socket_registry';

// Only that room's members need to see a mic/camera toggle -- looked up via
// roomSocketRegistry, same as broadcastRoomReaction.
export function broadcastRoomDeviceState(event: RoomDeviceStateEvent): void {
  const message: WsServerMessage = { event: 'room:device-state', ...event };
  const payload = JSON.stringify(message);

  for (const socket of roomSocketRegistry.get(event.roomId)) {
    if (socket.readyState === SOCKET_OPEN) {
      socket.send(payload);
    }
  }
}
