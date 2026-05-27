import { Request, Response, NextFunction } from 'express';
import * as expenseService from '../services/expense.service';
import { z } from 'zod';

const categoryEnum = z.enum(['FUEL', 'SERVICE', 'REPAIR', 'INSURANCE', 'CLEANING', 'EMI', 'OTHER']);

const createExpenseSchema = z.object({
  carId: z.string().min(1),
  category: categoryEnum.optional(),
  amount: z.number().positive(),
  expenseDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const updateExpenseSchema = z.object({
  category: categoryEnum.optional(),
  amount: z.number().positive().optional(),
  expenseDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const getExpenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const carId = req.query.carId ? String(req.query.carId) : undefined;
    res.json({ success: true, data: await expenseService.getAllExpenses(carId) });
  } catch (e) { next(e); }
};

export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createExpenseSchema.parse(req.body);
    const data = { ...parsed, expenseDate: parsed.expenseDate ? new Date(parsed.expenseDate) : undefined };
    res.status(201).json({ success: true, data: await expenseService.createExpense(data) });
  } catch (e) { next(e); }
};

export const updateExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateExpenseSchema.parse(req.body);
    const data = { ...parsed, expenseDate: parsed.expenseDate ? new Date(parsed.expenseDate) : undefined };
    res.json({ success: true, data: await expenseService.updateExpense(String(req.params.id), data) });
  } catch (e) { next(e); }
};

export const deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await expenseService.deleteExpense(String(req.params.id));
    res.json({ success: true, message: 'Expense deleted' });
  } catch (e) { next(e); }
};
