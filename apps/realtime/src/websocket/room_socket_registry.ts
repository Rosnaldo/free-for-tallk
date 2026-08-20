import { AuthenticatedWebSocket } from '#websocket/types';

// Room membership mirrored in memory as roomId -> connected member sockets,
// so a broadcast (reaction, device state, ...) can fan out to a room with a
// single Map lookup instead of a Redis round-trip (getRoom) plus a scan of
// every connected socket app-wide (clientRegistry). Kept in sync with
// room:create/join/leave/delete and socket close -- see room.ts and
// connection.ts.
const registry = new Map<string, Set<AuthenticatedWebSocket>>();

export function add(roomId: string, ws: AuthenticatedWebSocket): void {
    let sockets = registry.get(roomId);
    if (!sockets) {
        sockets = new Set();
        registry.set(roomId, sockets);
    }
    sockets.add(ws);
}

export function remove(roomId: string, ws: AuthenticatedWebSocket): void {
    const sockets = registry.get(roomId);
    if (!sockets) return;
    sockets.delete(ws);
    if (sockets.size === 0) registry.delete(roomId);
}

export function removeSocket(ws: AuthenticatedWebSocket): string[] {
    const roomIds: string[] = [];
    for (const [roomId, sockets] of registry) {
        if (sockets.delete(ws)) {
            roomIds.push(roomId);
            if (sockets.size === 0) registry.delete(roomId);
        }
    }
    return roomIds;
}

// Used when a room is deleted -- its members no longer need an entry to
// remove themselves from individually.
export function clear(roomId: string): void {
    registry.delete(roomId);
}

export function get(roomId: string): AuthenticatedWebSocket[] {
    const sockets = registry.get(roomId);
    return sockets ? [...sockets] : [];
}
