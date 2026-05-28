import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../lib/jwt';
import { AppError } from './error.middleware';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) throw new AppError(401, 'Unauthorized');
  try {
    const decoded = verifyToken(token);
    // Customer-portal tokens are signed with the same secret but carry
    // kind:'customer' — they must never satisfy the admin guard.
    if ((decoded as { kind?: string }).kind === 'customer') {
      throw new AppError(401, 'Invalid token');
    }
    req.user = decoded;
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
};
