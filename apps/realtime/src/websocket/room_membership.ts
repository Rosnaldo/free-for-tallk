// Tracks which room each connected user is currently in, so a dropped
// socket (tab close, network blip) can be cleaned out of its room's member
// list on 'close' instead of leaving a ghost member behind forever.
const membership = new Map<string, string>();

export function set(userId: string, roomId: string): void {
  membership.set(userId, roomId);
}

export function get(userId: string): string | undefined {
  return membership.get(userId);
}

export function remove(userId: string): void {
  membership.delete(userId);
}
