import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { ExpenseCategory } from '@prisma/client';

export const getAllExpenses = (carId?: string) =>
  prisma.expense.findMany({
    where: { deletedAt: null, ...(carId ? { carId } : {}) },
    include: { car: { select: { carName: true, registrationNumber: true } } },
    orderBy: { expenseDate: 'desc' },
  });

export const createExpense = async (data: {
  carId: string;
  category?: ExpenseCategory;
  amount: number;
  expenseDate?: Date;
  notes?: string;
}) => {
  const car = await prisma.car.findFirst({ where: { id: data.carId, deletedAt: null } });
  if (!car) throw new AppError(404, 'Car not found');
  return prisma.expense.create({ data });
};

export const updateExpense = async (
  id: string,
  data: { category?: ExpenseCategory; amount?: number; expenseDate?: Date; notes?: string }
) => {
  const expense = await prisma.expense.findFirst({ where: { id, deletedAt: null } });
  if (!expense) throw new AppError(404, 'Expense not found');
  return prisma.expense.update({ where: { id }, data });
};

export const deleteExpense = async (id: string) => {
  const expense = await prisma.expense.findFirst({ where: { id, deletedAt: null } });
  if (!expense) throw new AppError(404, 'Expense not found');
  return prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
};
