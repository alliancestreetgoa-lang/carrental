import { Request, Response, NextFunction } from 'express';
import * as paymentService from '../services/payment.service';
import { emitRealtime } from '../socket';
import { z } from 'zod';

const createPaymentSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']).optional(),
  paymentDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const listQuerySchema = z.object({
  bookingId: z.string().optional(),
  method: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
});

export const getPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = listQuerySchema.parse(req.query);
    const data = await paymentService.getAllPayments({
      bookingId: q.bookingId,
      method: q.method,
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
      search: q.search,
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const getSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await paymentService.getBillingSummary() }); } catch (e) { next(e); }
};

export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createPaymentSchema.parse(req.body);
    const data = {
      ...parsed,
      paymentDate: parsed.paymentDate ? new Date(parsed.paymentDate) : undefined,
    };
    const created = await paymentService.createPayment(data);
    emitRealtime('payment:added', { bookingId: data.bookingId });
    emitRealtime('booking:updated', { id: data.bookingId });
    res.status(201).json({ success: true, data: created });
  } catch (e) { next(e); }
};

export const deletePayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await paymentService.deletePayment(String(req.params.id));
    emitRealtime('payment:added');
    res.json({ success: true, message: 'Payment deleted' });
  } catch (e) { next(e); }
};
