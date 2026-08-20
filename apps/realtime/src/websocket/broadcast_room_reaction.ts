import { SOCKET_OPEN, RoomReactionEvent, WsServerMessage } from '@repo/shared-types';

import { clientRegistry } from './client_registry';
import { getRoom } from '../services/room_list_redis';

// Unlike broadcastRoomDelta (relevant to every connected client, since the
// room list view is global), a reaction only matters to sockets whose user
// is currently a member of that specific room. Membership is looked up in
// Redis (the authoritative room state) rather than the in-memory
// roomMembership map, which only reflects joins this process itself
// handled and goes stale across restarts/redeploys.
export async function broadcastRoomReaction(event: RoomReactionEvent): Promise<void> {
  const room = await getRoom(event.roomId);
  if (!room) return;

  const memberIds = new Set(room.members);
  const message: WsServerMessage = { event: 'room:reaction', ...event };
  const payload = JSON.stringify(message);

  for (const socket of clientRegistry) {
    if (socket.readyState === SOCKET_OPEN && memberIds.has(socket.user._id)) {
      socket.send(payload);
    }
  }
}
