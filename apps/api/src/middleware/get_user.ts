import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@repo/shared-types';

import { getUserModel, toUser } from '../models/user';
import { generateUniqueSlug } from '../utils/unique_slug';
import logger from '../logger';

// Chains after GetKeycloakUser: looks up (or auto-creates, for a
// first-time login) the Mongo user matching req.userKc.email and attaches
// it as req.currentUser.
export async function GetUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, firstName, lastName } = req.userKc;
    if (!email) throw new Error('Token missing email claim');

    const model = getUserModel();
    let doc = await model.findOne({ email });

    if (!doc) {
      doc = await model.create({
        firstName: firstName ?? '',
        lastName: lastName ?? '',
        slug: await generateUniqueSlug(`${firstName ?? ''}-${lastName ?? ''}`),
        email,
        role: UserRole.member,
      });
    }

    req.currentUser = toUser(doc);
    next();
  } catch (err) {
    logger.warn(err, 'GetUser: unauthorized');
    res.status(401).json({ message: 'unauthorized' });
  }
}
