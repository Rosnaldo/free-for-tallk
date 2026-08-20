import { getRedisClient } from './singleton';
import { onKeyExpired } from './expiry_subscriber';

const GRACE_PERIOD_SECONDS = 30;

function prefixFor(): string {
  return `grace:`;
}

export async function startGracePeriod(id: string): Promise<void> {
  await getRedisClient().set(`${prefixFor()}:${id}`, '1', 'EX', GRACE_PERIOD_SECONDS, 'NX');
}

export async function cancelGracePeriod(id: string): Promise<boolean> {
  const removed = await getRedisClient().del(`${prefixFor()}:${id}`);
  return removed === 1;
}

export async function hasGracePeriod(id: string): Promise<boolean> {
  const exists = await getRedisClient().exists(`${prefixFor()}:${id}`);
  return exists === 1;
}

export function onGraceExpired(handler: (id: string) => void): void {
  onKeyExpired(prefixFor(), handler);
}
