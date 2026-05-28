import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { ExpenseCategory, Prisma } from '@prisma/client';

export const getAllExpenses = (filters: {
  carId?: string;
  category?: ExpenseCategory;
  from?: Date;
  to?: Date;
} = {}) => {
  const where: Prisma.ExpenseWhereInput = {
    deletedAt: null,
    ...(filters.carId ? { carId: filters.carId } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.from || filters.to
      ? { expenseDate: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } }
      : {}),
  };
  return prisma.expense.findMany({
    where,
    include: { car: { select: { carName: true, brand: true, registrationNumber: true } } },
    orderBy: { expenseDate: 'desc' },
  });
};

export const getExpenseSummary = async (fromInput?: Date, toInput?: Date) => {
  const to = toInput ?? new Date();
  const from = fromInput ?? new Date(to.getFullYear(), to.getMonth() - 5, 1);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const expenses = await prisma.expense.findMany({
    where: { deletedAt: null, expenseDate: { gte: from, lte: to } },
    select: { amount: true, category: true, expenseDate: true, carId: true, car: { select: { carName: true, brand: true, registrationNumber: true } } },
  });

  // Month buckets (cap 12)
  const buckets: { key: string; label: string }[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  while (cursor <= to && buckets.length < 12) {
    buckets.push({ key: `${cursor.getFullYear()}-${cursor.getMonth()}`, label: cursor.toLocaleString('en-IN', { month: 'short', year: '2-digit' }) });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const monthMap = new Map(buckets.map((b) => [b.key, 0]));
  const catMap = new Map<string, number>();
  const carMap = new Map<string, { label: string; total: number }>();
  let total = 0;
  let monthTotal = 0;

  for (const e of expenses) {
    const amt = Number(e.amount);
    total += amt;
    if (e.expenseDate >= startOfMonth) monthTotal += amt;
    const mk = `${e.expenseDate.getFullYear()}-${e.expenseDate.getMonth()}`;
    if (monthMap.has(mk)) monthMap.set(mk, monthMap.get(mk)! + amt);
    catMap.set(e.category, (catMap.get(e.category) ?? 0) + amt);
    const car = carMap.get(e.carId) ?? { label: `${e.car.brand} ${e.car.carName}`, total: 0 };
    car.total += amt;
    carMap.set(e.carId, car);
  }

  return {
    total,
    monthTotal,
    count: expenses.length,
    byMonth: buckets.map((b) => ({ month: b.label, total: monthMap.get(b.key)! })),
    byCategory: [...catMap.entries()].map(([category, t]) => ({ category, total: t })).sort((a, b) => b.total - a.total),
    byCar: [...carMap.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.total - a.total).slice(0, 5),
  };
};

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
