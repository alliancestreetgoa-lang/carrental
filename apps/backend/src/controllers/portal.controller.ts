import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as portalAuth from '../services/portalAuth.service';
import * as catalog from '../services/portalCatalog.service';
import * as bookingService from '../services/booking.service';
import * as agreementService from '../services/agreement.service';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { streamInvoicePdf } from '../lib/invoice';
import { streamAgreementPdf } from '../lib/agreementPdf';
import { FuelType, Transmission } from '@prisma/client';

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().min(7),
  password: z.string().min(6),
  licenseNumber: z.string().optional(),
});
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, customer } = await portalAuth.registerCustomer(registerSchema.parse(req.body));
    res.cookie('customer_token', token, cookieOpts);
    res.status(201).json({ success: true, data: { customer, token } });
  } catch (e) { next(e); }
};

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const { token, customer } = await portalAuth.loginCustomer(email, password);
    res.cookie('customer_token', token, cookieOpts);
    res.json({ success: true, data: { customer, token } });
  } catch (e) { next(e); }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie('customer_token');
  res.json({ success: true, message: 'Logged out' });
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await portalAuth.getCustomerById(req.customer!.customerId) }); }
  catch (e) { next(e); }
};

const listQuery = z.object({
  from: z.string().optional(), to: z.string().optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
  transmission: z.nativeEnum(Transmission).optional(),
  seats: z.coerce.number().int().positive().optional(),
  q: z.string().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest']).optional(),
});
export const listCars = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = listQuery.parse(req.query);
    const data = await catalog.listCars({
      ...q,
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const getCar = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await catalog.getCar(String(req.params.id)) }); }
  catch (e) { next(e); }
};

const availQuery = z.object({ from: z.string(), to: z.string() });
export const availability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = availQuery.parse(req.query);
    res.json({ success: true, data: await catalog.getAvailability(String(req.params.id), new Date(from), new Date(to)) });
  } catch (e) { next(e); }
};

const createBookingSchema = z.object({
  carId: z.string().min(1),
  pickupDate: z.string(),
  returnDate: z.string(),
  pickupLocation: z.string().optional(),
  dropLocation: z.string().optional(),
});
export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const b = createBookingSchema.parse(req.body);
    const booking = await bookingService.createBooking({
      customerId: req.customer!.customerId,
      carId: b.carId,
      pickupDate: new Date(b.pickupDate),
      returnDate: new Date(b.returnDate),
      pickupLocation: b.pickupLocation,
      dropLocation: b.dropLocation,
      advancePayment: 0,
    });
    res.status(201).json({ success: true, data: booking });
  } catch (e) { next(e); }
};

export const myBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.booking.findMany({
      where: { deletedAt: null, customerId: req.customer!.customerId },
      include: {
        car: { select: { carName: true, brand: true, registrationNumber: true, images: true } },
        payments: { where: { deletedAt: null }, select: { amount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const ownedBooking = async (id: string, customerId: string) => {
  const booking = await bookingService.getBookingById(id);
  if ((booking as { customerId: string }).customerId !== customerId) throw new AppError(404, 'Booking not found');
  return booking;
};

export const myBookingDetail = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await ownedBooking(String(req.params.id), req.customer!.customerId) }); }
  catch (e) { next(e); }
};

export const invoicePdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const b = await ownedBooking(String(req.params.id), req.customer!.customerId);
    streamInvoicePdf(res, {
      id: b.id,
      pickupDate: b.pickupDate,
      returnDate: b.returnDate,
      actualReturnDate: b.actualReturnDate,
      totalDays: b.totalDays,
      customer: b.customer,
      car: b.car,
      invoice: b.invoice,
    });
  } catch (e) { next(e); }
};

export const agreementPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const b = await ownedBooking(String(req.params.id), req.customer!.customerId);
    if (!b.agreement) throw new AppError(404, 'No agreement available for this booking yet');
    const a = await agreementService.getAgreementById(b.agreement.id);
    streamAgreementPdf(res, a);
  } catch (e) { next(e); }
};
