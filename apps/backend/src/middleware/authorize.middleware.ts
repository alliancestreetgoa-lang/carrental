import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from './error.middleware';

export const authorize = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError(401, 'Unauthorized');
    if (!roles.includes(req.user.role as Role)) {
      throw new AppError(403, 'Insufficient permissions');
    }
    next();
  };
};
