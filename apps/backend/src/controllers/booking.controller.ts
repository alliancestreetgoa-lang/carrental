import { Request, Response, NextFunction } from 'express';
import * as bookingService from '../services/booking.service';
import { streamInvoicePdf } from '../lib/invoice';
import { z } from 'zod';

const emptyToUndef = (v: unknown) => (v === '' || v === null ? undefined : v);
const optionalNumber = z.preprocess(emptyToUndef, z.coerce.number().nonnegative().optional());

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

const updateBookingSchema = z.object({
  pickupDate: z.preprocess(emptyToUndef, z.string().datetime().optional()),
  returnDate: z.preprocess(emptyToUndef, z.string().datetime().optional()),
  pickupLocation: z.preprocess(emptyToUndef, z.string().optional()),
  dropLocation: z.preprocess(emptyToUndef, z.string().optional()),
  fuelLevel: z.preprocess(emptyToUndef, z.string().optional()),
  startKilometer: optionalNumber,
  advancePayment: optionalNumber,
  securityDeposit: optionalNumber,
});

const statusSchema = z.object({ status: z.enum(['RESERVED', 'ACTIVE', 'CANCELLED']) });

const completeSchema = z.object({
  endKilometer: optionalNumber,
  returnFuelLevel: z.preprocess(emptyToUndef, z.string().optional()),
  actualReturnDate: z.preprocess(emptyToUndef, z.string().datetime().optional()),
});

const listQuerySchema = z.object({
  status: z.enum(['RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
});

export const getBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = listQuerySchema.parse(req.query);
    res.json({ success: true, data: await bookingService.getAllBookings(status) });
  } catch (e) { next(e); }
};

export const getBooking = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await bookingService.getBookingById(String(req.params.id)) }); } catch (e) { next(e); }
};

export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createBookingSchema.parse(req.body);
    const data = { ...parsed, pickupDate: new Date(parsed.pickupDate), returnDate: new Date(parsed.returnDate) };
    res.status(201).json({ success: true, data: await bookingService.createBooking(data) });
  } catch (e) { next(e); }
};

export const updateBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateBookingSchema.parse(req.body);
    const data = {
      ...parsed,
      pickupDate: parsed.pickupDate ? new Date(parsed.pickupDate) : undefined,
      returnDate: parsed.returnDate ? new Date(parsed.returnDate) : undefined,
    };
    res.json({ success: true, data: await bookingService.updateBooking(String(req.params.id), data) });
  } catch (e) { next(e); }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = statusSchema.parse(req.body);
    res.json({ success: true, data: await bookingService.updateBookingStatus(String(req.params.id), status) });
  } catch (e) { next(e); }
};

export const completeBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = completeSchema.parse(req.body);
    const data = {
      endKilometer: parsed.endKilometer as number | undefined,
      returnFuelLevel: parsed.returnFuelLevel as string | undefined,
      actualReturnDate: parsed.actualReturnDate ? new Date(parsed.actualReturnDate as string) : undefined,
    };
    res.json({ success: true, data: await bookingService.completeBooking(String(req.params.id), data) });
  } catch (e) { next(e); }
};

export const cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await bookingService.updateBookingStatus(String(req.params.id), 'CANCELLED') });
  } catch (e) { next(e); }
};

export const deleteBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await bookingService.deleteBooking(String(req.params.id));
    res.json({ success: true, message: 'Booking deleted' });
  } catch (e) { next(e); }
};

export const getInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.getBookingById(String(req.params.id));
    streamInvoicePdf(res, {
      id: booking.id,
      pickupDate: booking.pickupDate,
      returnDate: booking.returnDate,
      actualReturnDate: booking.actualReturnDate,
      totalDays: booking.totalDays,
      customer: booking.customer,
      car: booking.car,
      invoice: booking.invoice,
    });
  } catch (e) { next(e); }
};
