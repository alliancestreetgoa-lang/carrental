import { Request, Response, NextFunction } from 'express';
import * as paymentService from '../services/payment.service';
import { z } from 'zod';

const createPaymentSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']).optional(),
  paymentDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const getPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookingId = req.query.bookingId ? String(req.query.bookingId) : undefined;
    res.json({ success: true, data: await paymentService.getAllPayments(bookingId) });
  } catch (e) { next(e); }
};

export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createPaymentSchema.parse(req.body);
    const data = {
      ...parsed,
      paymentDate: parsed.paymentDate ? new Date(parsed.paymentDate) : undefined,
    };
    res.status(201).json({ success: true, data: await paymentService.createPayment(data) });
  } catch (e) { next(e); }
};

export const deletePayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await paymentService.deletePayment(String(req.params.id));
    res.json({ success: true, message: 'Payment deleted' });
  } catch (e) { next(e); }
};
