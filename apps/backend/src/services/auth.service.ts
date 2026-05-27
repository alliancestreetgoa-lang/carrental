import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { AppError } from '../middleware/error.middleware';

export const loginService = async (email: string, password: string) => {
  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (!user) throw new AppError(401, 'Invalid credentials');
  if (!user.isActive) throw new AppError(403, 'Account is disabled');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError(401, 'Invalid credentials');

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  const { password: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
};

export const getMeService = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  if (!user) throw new AppError(404, 'User not found');
  return user;
};
