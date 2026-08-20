import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@repo/shared-types';

export function requireRole(allowList: Array<keyof typeof UserRole>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!allowList.includes(req.currentUser.role)) {
      res.status(403).json({ message: 'forbidden' });
      return;
    }
    next();
  };
}
