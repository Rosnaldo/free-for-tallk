import { Request, Response, NextFunction } from 'express';

import { verifyUserToken } from '../keycloak/verify_token';
import logger from '../logger';

// Only verifies the caller is a genuine, signed-in Keycloak identity and
// attaches it to req.userKc -- does NOT touch Mongo. Routes that need the
// app's own user record (role, slug, etc.) chain GetUser after this.
export async function GetKeycloakUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    req.userKc = await verifyUserToken(req.headers.authorization || '');
    next();
  } catch (err) {
    logger.warn(err, 'GetKeycloakUser: unauthorized');
    res.status(401).json({ message: 'unauthorized' });
  }
}
