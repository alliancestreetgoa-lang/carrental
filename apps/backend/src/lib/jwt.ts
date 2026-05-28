import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

export interface CustomerJwtPayload {
  customerId: string;
  email: string;
  kind: 'customer';
}

export const signCustomerToken = (payload: Omit<CustomerJwtPayload, 'kind'>): string =>
  jwt.sign({ ...payload, kind: 'customer' }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);

export const verifyCustomerToken = (token: string): CustomerJwtPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as CustomerJwtPayload;
  if (decoded.kind !== 'customer') throw new Error('Not a customer token');
  return decoded;
};
