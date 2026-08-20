import { Router } from 'express';

import { GetKeycloakUser } from '../middleware/get_keycloak_user';

const router = Router();

router.post('/auth/validate-token', GetKeycloakUser, (req, res) => {
  res.status(200).json(req.userKc);
});

export default router;
