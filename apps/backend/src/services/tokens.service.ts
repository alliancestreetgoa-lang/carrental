import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { VerificationType } from '@prisma/client';

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const LINK_TTL_MS = 60 * 60 * 1000; // 60 min
const OTP_TTL_MS = 10 * 60 * 1000;  // 10 min
const MAX_OTP_ATTEMPTS = 5;

// Invalidate the customer's prior un-consumed tokens of this type, then create a fresh one.
const issue = async (customerId: string, type: VerificationType, secret: string, ttlMs: number) => {
  await prisma.verificationToken.updateMany({
    where: { customerId, type, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  await prisma.verificationToken.create({
    data: { customerId, type, secretHash: sha256(secret), expiresAt: new Date(Date.now() + ttlMs) },
  });
};

export const issueLinkToken = async (customerId: string, type: 'EMAIL_VERIFY' | 'PASSWORD_RESET') => {
  const raw = crypto.randomBytes(32).toString('hex');
  await issue(customerId, type, raw, LINK_TTL_MS);
  return raw;
};

export const issueOtp = async (customerId: string) => {
  const code = String(crypto.randomInt(100000, 1000000)); // 6 digits
  await issue(customerId, 'MOBILE_OTP', code, OTP_TTL_MS);
  return code;
};

// Returns the customerId on success, else null. Single-use.
export const consumeLinkToken = async (type: 'EMAIL_VERIFY' | 'PASSWORD_RESET', raw: string) => {
  const token = await prisma.verificationToken.findFirst({
    where: { type, secretHash: sha256(raw), consumedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!token) return null;
  await prisma.verificationToken.update({ where: { id: token.id }, data: { consumedAt: new Date() } });
  return token.customerId;
};

export const verifyOtp = async (customerId: string, code: string): Promise<'ok' | 'invalid' | 'locked'> => {
  const token = await prisma.verificationToken.findFirst({
    where: { customerId, type: 'MOBILE_OTP', consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (!token || token.expiresAt < new Date()) return 'invalid';
  if (token.attempts >= MAX_OTP_ATTEMPTS) return 'locked';
  if (token.secretHash !== sha256(code)) {
    await prisma.verificationToken.update({ where: { id: token.id }, data: { attempts: { increment: 1 } } });
    return 'invalid';
  }
  await prisma.verificationToken.update({ where: { id: token.id }, data: { consumedAt: new Date() } });
  return 'ok';
};
