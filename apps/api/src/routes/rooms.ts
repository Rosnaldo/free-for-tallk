import { Router } from 'express';

import { GetKeycloakUser } from '../middleware/get_keycloak_user';
import { GetUser } from '../middleware/get_user';
import { getRoomList, getRoom, createRoom, deleteRoom } from '../redis/rooms';
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

router.post('/rooms', GetKeycloakUser, GetUser, async (req, res) => {
  try {
    const { title, subtitle, maxSlots } = req.body;
    if (typeof title !== 'string' || !title.trim() || typeof maxSlots !== 'number' || maxSlots < 1) {
      res.status(400).json({ message: 'Dados da sala inválidos' });
      return;
    }

    const room = await createRoom({
      title: title.trim(),
      subtitle: typeof subtitle === 'string' && subtitle.trim() ? subtitle.trim() : undefined,
      maxSlots,
      creatorId: req.currentUser._id,
    });
    res.status(201).json({ room });
  } catch (err) {
    logger.error(err, 'failed to create room');
    res.status(500).json({ message: 'Internal error' });
  }
});

router.delete('/rooms/:roomId', GetKeycloakUser, GetUser, async (req, res) => {
  try {
    const room = await getRoom(req.params.roomId);
    if (!room) {
      res.status(404).json({ message: 'Sala não encontrada' });
      return;
    }
    if (room.creator !== req.currentUser._id) {
      res.status(403).json({ message: 'Somente quem criou a sala pode excluí-la' });
      return;
    }

    await deleteRoom(req.params.roomId);
    res.status(204).send();
  } catch (err) {
    logger.error(err, 'failed to delete room');
    res.status(500).json({ message: 'Internal error' });
  }
});

export default router;
