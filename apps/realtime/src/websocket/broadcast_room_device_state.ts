import { SOCKET_OPEN, RoomDeviceStateEvent, WsServerMessage } from '@repo/shared-types';

import { clientRegistry } from './client_registry';
import { getRoom } from '../services/room_list_redis';

// Only that room's members need to see a mic/camera toggle -- membership is
// looked up in Redis (the authoritative room state), same as
// broadcastRoomReaction.
export async function broadcastRoomDeviceState(event: RoomDeviceStateEvent): Promise<void> {
  const room = await getRoom(event.roomId);
  if (!room) return;

  const memberIds = new Set(room.members);
  const message: WsServerMessage = { event: 'room:device-state', ...event };
  const payload = JSON.stringify(message);

  for (const socket of clientRegistry) {
    if (socket.readyState === SOCKET_OPEN && memberIds.has(socket.user._id)) {
      socket.send(payload);
    }
  }
}
