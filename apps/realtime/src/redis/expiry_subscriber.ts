import type Redis from 'ioredis';
import logger from '#logger';
import { getRedisClient } from './singleton';

// Shared by every Redis-TTL-backed mechanism in this process (grace periods,
// pending rings, ...) instead of each opening its own keyspace-notification
// connection -- there's only one notify-keyspace-events CONFIG to set and
// one __keyevent@*__:expired subscription worth paying for, regardless of
// how many different kinds of key it's dispatching for.
type ExpiryHandler = (id: string) => void;

const handlersByPrefix = new Map<string, ExpiryHandler>();

// `prefix` identifies a family of keys shaped `${prefix}:${id}` -- whichever
// registered prefix an expired key starts with gets `id` (everything after
// that one colon) handed to its handler.
export function onKeyExpired(prefix: string, handler: ExpiryHandler): void {
  handlersByPrefix.set(prefix, handler);
}

let subscriber: Redis | undefined;

export async function startExpirySubscriber(): Promise<void> {
  // 'Ex' -- keyevent notifications (E) for expired keys (x) only. This is a
  // CONFIG SET, not a merge, but nothing else in this codebase currently
  // relies on any other notify-keyspace-events flag.
  await getRedisClient().config('SET', 'notify-keyspace-events', 'Ex');

  // Pub/sub requires a connection dedicated to subscribe mode -- once
  // .psubscribe() is called, that connection can't issue any other Redis
  // command, so this must stay separate from the shared singleton (same
  // reasoning as redis/subscriber.ts's own duplicate()).
  subscriber = getRedisClient().duplicate();
  subscriber.on('error', (err) => logger.error(err, 'expiry redis subscriber connection error'));

  subscriber.on('pmessage', (_pattern, _channel, expiredKey: string) => {
    for (const [prefix, handler] of handlersByPrefix) {
      if (expiredKey.startsWith(`${prefix}:`)) {
        handler(expiredKey.slice(prefix.length + 1));
        return;
      }
    }
  });

  await subscriber.psubscribe('__keyevent@*__:expired');
}

export async function stopExpirySubscriber(): Promise<void> {
  if (!subscriber) return;
  await subscriber.punsubscribe();
  await subscriber.quit();
  subscriber = undefined;
}
