import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { verifyCustomerToken, CustomerJwtPayload } from '../lib/jwt';
import { AppError } from './error.middleware';

declare global {
  namespace Express {
    interface Request {
      customer?: CustomerJwtPayload;
    }
  }
}

export const authenticateCustomer = async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.customer_token || req.headers.authorization?.split(' ')[1];
  if (!token) return next(new AppError(401, 'Unauthorized'));
  try {
    const payload = verifyCustomerToken(token);
    const customer = await prisma.customer.findFirst({ where: { id: payload.customerId, deletedAt: null } });
    if (!customer) return next(new AppError(401, 'Account not found'));
    if (customer.blacklisted) return next(new AppError(403, 'Account is not permitted to book'));
    req.customer = payload;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
};
