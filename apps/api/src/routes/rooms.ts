import { Router } from 'express';

import { GetKeycloakUser } from '../middleware/get_keycloak_user';
import { GetUser } from '../middleware/get_user';
import { getRoomList } from '../redis/rooms';
import logger from '../logger';

const router = Router();

router.get('/rooms', GetKeycloakUser, GetUser, async (_req, res) => {
  try {
    const rooms = await getRoomList();
    res.status(200).json({ rooms });
  } catch (err) {
    logger.error(err, 'failed to list rooms');
    res.status(500).json({ message: 'Internal error' });
  }
});

export default router;
