import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { Role } from '@prisma/client';

const safeSelect = {
  id: true, name: true, email: true, mobile: true, role: true, isActive: true, createdAt: true,
};

export const getAllUsers = () =>
  prisma.user.findMany({ where: { deletedAt: null }, select: safeSelect, orderBy: { createdAt: 'desc' } });

export const createUser = async (data: {
  name: string; email: string; password: string; mobile?: string; role: Role;
}) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError(409, 'A user with this email already exists');
  const password = await bcrypt.hash(data.password, 12);
  return prisma.user.create({
    data: { name: data.name, email: data.email, password, mobile: data.mobile, role: data.role },
    select: safeSelect,
  });
};

export const updateUser = async (
  id: string,
  data: { name?: string; mobile?: string; role?: Role; isActive?: boolean; password?: string }
) => {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!user) throw new AppError(404, 'User not found');
  const patch: Record<string, unknown> = {
    name: data.name, mobile: data.mobile, role: data.role, isActive: data.isActive,
  };
  if (data.password) patch.password = await bcrypt.hash(data.password, 12);
  return prisma.user.update({ where: { id }, data: patch, select: safeSelect });
};

export const deleteUser = async (id: string, requesterId: string) => {
  if (id === requesterId) throw new AppError(400, 'You cannot deactivate your own account');
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!user) throw new AppError(404, 'User not found');
  return prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false }, select: safeSelect });
};
