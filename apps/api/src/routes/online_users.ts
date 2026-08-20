import { Router } from 'express';

import { getOnlineUserList } from '../redis/online_users';
import logger from '../logger';

const router = Router();

router.get('/online-users', async (_req, res) => {
  try {
    const users = await getOnlineUserList();
    res.status(200).json({ users });
  } catch (err) {
    logger.error(err, 'failed to list online users');
    res.status(500).json({ message: 'Internal error' });
  }
});

export default router;
