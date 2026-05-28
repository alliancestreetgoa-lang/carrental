import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signCustomerToken } from '../lib/jwt';
import { AppError } from '../middleware/error.middleware';

const publicCustomer = {
  id: true, fullName: true, email: true, mobile: true, whatsapp: true,
  address: true, licenseNumber: true, licenseExpiry: true, createdAt: true,
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
