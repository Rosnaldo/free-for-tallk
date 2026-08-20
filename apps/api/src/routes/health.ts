import { Router } from 'express';
import mongoose from 'mongoose';

import { getRedisClient } from '../redis/connection';

const router = Router();

router.get('/liveness', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

async function isRedisReady(): Promise<boolean> {
  try {
    await getRedisClient().ping();
    return true;
  } catch {
    return false;
  }
}

router.get('/readiness', async (req, res) => {
  const checks = {
    mongo: mongoose.connection.readyState === 1,
    redis: await isRedisReady(),
  };
  const ready = Object.values(checks).every(Boolean);

  res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'not ready', checks });
});

export default router;
