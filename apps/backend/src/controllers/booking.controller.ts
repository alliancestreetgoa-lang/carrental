import { Request, Response, NextFunction } from 'express';
import * as bookingService from '../services/booking.service';
import { z } from 'zod';

const createBookingSchema = z.object({
  customerId: z.string().min(1),
  carId: z.string().min(1),
  pickupDate: z.string().datetime(),
  returnDate: z.string().datetime(),
  pickupLocation: z.string().optional(),
  dropLocation: z.string().optional(),
  fuelLevel: z.string().optional(),
  startKilometer: z.number().int().nonnegative().optional(),
  advancePayment: z.number().nonnegative().optional(),
  securityDeposit: z.number().nonnegative().optional(),
  totalAmount: z.number().nonnegative().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  endKilometer: z.number().int().nonnegative().optional(),
});

export const getBookings = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await bookingService.getAllBookings() }); } catch (e) { next(e); }
};

export const getBooking = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await bookingService.getBookingById(String(req.params.id)) }); } catch (e) { next(e); }
};

export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createBookingSchema.parse(req.body);
    const data = {
      ...parsed,
      pickupDate: new Date(parsed.pickupDate),
      returnDate: new Date(parsed.returnDate),
    };
    res.status(201).json({ success: true, data: await bookingService.createBooking(data) });
  } catch (e) { next(e); }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, endKilometer } = updateStatusSchema.parse(req.body);
    res.json({ success: true, data: await bookingService.updateBookingStatus(String(req.params.id), status, endKilometer) });
  } catch (e) { next(e); }
};

export const deleteBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await bookingService.deleteBooking(String(req.params.id));
    res.json({ success: true, message: 'Booking deleted' });
  } catch (e) { next(e); }
};
