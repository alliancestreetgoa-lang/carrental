import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signCustomerToken } from '../lib/jwt';
import { AppError } from '../middleware/error.middleware';
import * as tokens from './tokens.service';
import * as notify from './notify.service';

const publicCustomer = {
  id: true, fullName: true, email: true, mobile: true, whatsapp: true,
  address: true, licenseNumber: true, licenseExpiry: true, createdAt: true,
  emailVerifiedAt: true, mobileVerifiedAt: true,
} as const;

export const registerCustomer = async (data: {
  fullName: string; email: string; mobile: string; password: string; licenseNumber?: string;
}) => {
  const existing = await prisma.customer.findFirst({ where: { email: data.email, deletedAt: null } });
  if (existing) throw new AppError(409, 'An account with this email already exists');
  const hashed = await bcrypt.hash(data.password, 12);
  const customer = await prisma.customer.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      mobile: data.mobile,
      password: hashed,
      licenseNumber: data.licenseNumber?.trim() || `PENDING-${Date.now()}`,
    },
    select: publicCustomer,
  });
  const token = signCustomerToken({ customerId: customer.id, email: customer.email! });
  return { token, customer };
};

export const loginCustomer = async (email: string, password: string) => {
  const customer = await prisma.customer.findFirst({ where: { email, deletedAt: null } });
  if (!customer || !customer.password) throw new AppError(401, 'Invalid credentials');
  if (customer.blacklisted) throw new AppError(403, 'Account is not permitted to book');
  const valid = await bcrypt.compare(password, customer.password);
  if (!valid) throw new AppError(401, 'Invalid credentials');
  const token = signCustomerToken({ customerId: customer.id, email: customer.email! });
  const { password: _pw, ...safe } = customer;
  return { token, customer: safe };
};

export const getCustomerById = (id: string) =>
  prisma.customer.findFirst({ where: { id, deletedAt: null }, select: publicCustomer });

// Issue + "send" the registration-time email verify link and mobile OTP.
// Returns the raw secrets for the dev echo.
export const issueRegistrationSecrets = async (customer: { id: string; email: string | null; mobile: string }) => {
  let emailToken: string | null = null;
  if (customer.email) {
    emailToken = await tokens.issueLinkToken(customer.id, 'EMAIL_VERIFY');
    await notify.sendVerificationEmail(customer.email, emailToken);
  }
  const mobileOtp = await tokens.issueOtp(customer.id);
  await notify.sendOtpSms(customer.mobile, mobileOtp);
  return { emailToken, mobileOtp };
};

export const verifyEmail = async (rawToken: string) => {
  const customerId = await tokens.consumeLinkToken('EMAIL_VERIFY', rawToken);
  if (!customerId) throw new AppError(400, 'This link is invalid or has expired');
  await prisma.customer.update({ where: { id: customerId }, data: { emailVerifiedAt: new Date() } });
};

export const resendVerification = async (customerId: string) => {
  const c = await prisma.customer.findFirst({ where: { id: customerId, deletedAt: null } });
  if (!c || !c.email) throw new AppError(400, 'No email on file');
  if (c.emailVerifiedAt) return null;
  const raw = await tokens.issueLinkToken(customerId, 'EMAIL_VERIFY');
  await notify.sendVerificationEmail(c.email, raw);
  return raw;
};

// Enumeration-safe: returns the raw token only when the account actually exists.
export const forgotPassword = async (email: string) => {
  const c = await prisma.customer.findFirst({ where: { email, deletedAt: null } });
  if (!c || !c.password) return null;
  const raw = await tokens.issueLinkToken(c.id, 'PASSWORD_RESET');
  await notify.sendResetEmail(email, raw);
  return raw;
};

export const resetPassword = async (rawToken: string, password: string) => {
  const customerId = await tokens.consumeLinkToken('PASSWORD_RESET', rawToken);
  if (!customerId) throw new AppError(400, 'This link is invalid or has expired');
  const hashed = await bcrypt.hash(password, 12);
  await prisma.customer.update({ where: { id: customerId }, data: { password: hashed } });
  await prisma.verificationToken.updateMany({
    where: { customerId, type: 'PASSWORD_RESET', consumedAt: null },
    data: { consumedAt: new Date() },
  });
};

export const requestMobileOtp = async (customerId: string) => {
  const c = await prisma.customer.findFirst({ where: { id: customerId, deletedAt: null } });
  if (!c) throw new AppError(404, 'Account not found');
  const code = await tokens.issueOtp(customerId);
  await notify.sendOtpSms(c.mobile, code);
  return code;
};

export const confirmMobileOtp = async (customerId: string, code: string) => {
  const result = await tokens.verifyOtp(customerId, code);
  if (result === 'locked') throw new AppError(429, 'Too many attempts — request a new code');
  if (result !== 'ok') throw new AppError(400, 'Incorrect or expired code');
  await prisma.customer.update({ where: { id: customerId }, data: { mobileVerifiedAt: new Date() } });
};
