import { ISocket } from '@repo/shared-types';

const registry = new Map<string, ISocket>();

export function set(userId: string, ws: ISocket): void {
  registry.set(userId, ws);
}

export function get(userId: string): ISocket | undefined {
  return registry.get(userId);
}

export function remove(userId: string): void {
  registry.delete(userId);
}

// Every currently-connected volunteer/admin socket -- used to broadcast to
// all of them at once (see broadcast_volunteer_list.ts), as opposed to get()'s
// single-volunteer lookup.
export function all(): ISocket[] {
  return [...registry.values()];
}
