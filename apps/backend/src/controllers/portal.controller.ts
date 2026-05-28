import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as portalAuth from '../services/portalAuth.service';
import * as catalog from '../services/portalCatalog.service';
import * as bookingService from '../services/booking.service';
import * as agreementService from '../services/agreement.service';
import * as reviewService from '../services/review.service';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { streamInvoicePdf } from '../lib/invoice';
import { streamAgreementPdf } from '../lib/agreementPdf';
import { FuelType, Transmission } from '@prisma/client';
import { emitRealtime } from '../socket';
import * as payments from '../lib/payments';

const isDev = process.env.NODE_ENV !== 'production';

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
    const secrets = await portalAuth.issueRegistrationSecrets({ id: customer.id, email: customer.email, mobile: customer.mobile });
    res.status(201).json({
      success: true,
      data: { customer, token, ...(isDev ? { devSecret: { emailToken: secrets.emailToken, mobileOtp: secrets.mobileOtp } } : {}) },
    });
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
  try {
    const c = await portalAuth.getCustomerById(req.customer!.customerId);
    res.json({
      success: true,
      data: c ? { ...c, emailVerified: !!c.emailVerifiedAt, mobileVerified: !!c.mobileVerifiedAt } : null,
    });
  } catch (e) { next(e); }
};

const listQuery = z.object({
  from: z.string().optional(), to: z.string().optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
  transmission: z.nativeEnum(Transmission).optional(),
  seats: z.coerce.number().int().positive().optional(),
  q: z.string().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest']).optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
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

export const listBrands = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await catalog.listBrands() }); }
  catch (e) { next(e); }
};

export const relatedCars = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await catalog.getRelatedCars(String(req.params.id)) }); }
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
      approvalStatus: 'PENDING',
    });
    emitRealtime('booking:created', { id: booking.id });
    emitRealtime('car:changed', { id: booking.carId });
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

export const cancelMyBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const b = await ownedBooking(String(req.params.id), req.customer!.customerId);
    if (b.bookingStatus !== 'RESERVED') throw new AppError(400, 'Only upcoming (reserved) bookings can be cancelled');
    const updated = await bookingService.updateBookingStatus(b.id, 'CANCELLED');
    emitRealtime('booking:cancelled', { id: updated.id });
    emitRealtime('car:changed', { id: b.carId });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
};

const extendSchema = z.object({ returnDate: z.string() });
export const extendMyBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const b = await ownedBooking(String(req.params.id), req.customer!.customerId);
    const { returnDate } = extendSchema.parse(req.body);
    const updated = await bookingService.extendBooking(b.id, new Date(returnDate));
    emitRealtime('booking:updated', { id: updated.id });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
};

export const myPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.payment.findMany({
      where: { deletedAt: null, booking: { customerId: req.customer!.customerId, deletedAt: null } },
      orderBy: { paymentDate: 'desc' },
      include: { booking: { select: { id: true, car: { select: { carName: true, brand: true, registrationNumber: true } } } } },
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
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

const tokenSchema = z.object({ token: z.string().min(1) });
const emailSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({ token: z.string().min(1), password: z.string().min(6) });
const otpSchema = z.object({ code: z.string().min(4).max(8) });

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try { await portalAuth.verifyEmail(tokenSchema.parse(req.body).token); res.json({ success: true }); }
  catch (e) { next(e); }
};

export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = await portalAuth.resendVerification(req.customer!.customerId);
    res.json({ success: true, ...(isDev && raw ? { devSecret: raw } : {}) });
  } catch (e) { next(e); }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = await portalAuth.forgotPassword(emailSchema.parse(req.body).email);
    res.json({ success: true, ...(isDev && raw ? { devSecret: raw } : {}) });
  } catch (e) { next(e); }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try { const p = resetSchema.parse(req.body); await portalAuth.resetPassword(p.token, p.password); res.json({ success: true }); }
  catch (e) { next(e); }
};

export const sendMobileOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = await portalAuth.requestMobileOtp(req.customer!.customerId);
    res.json({ success: true, ...(isDev ? { devSecret: code } : {}) });
  } catch (e) { next(e); }
};

export const verifyMobileOtp = async (req: Request, res: Response, next: NextFunction) => {
  try { await portalAuth.confirmMobileOtp(req.customer!.customerId, otpSchema.parse(req.body).code); res.json({ success: true }); }
  catch (e) { next(e); }
};

const reviewSchema = z.object({ bookingId: z.string().min(1), rating: z.number().int().min(1).max(5), comment: z.string().max(1000).optional() });
export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json({ success: true, data: await reviewService.createReview({ customerId: req.customer!.customerId, ...reviewSchema.parse(req.body) }) }); }
  catch (e) { next(e); }
};
export const carReviews = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await reviewService.getCarReviews(String(req.params.id)) }); }
  catch (e) { next(e); }
};
export const testimonials = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await reviewService.getTestimonials() }); }
  catch (e) { next(e); }
};

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  mobile: z.string().min(7).optional(),
  whatsapp: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  licenseNumber: z.string().min(3).optional(),
  licenseExpiry: z.string().nullable().optional(),
});
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = updateProfileSchema.parse(req.body);
    const c = await portalAuth.updateProfile(req.customer!.customerId, {
      ...p,
      licenseExpiry: p.licenseExpiry === undefined ? undefined : p.licenseExpiry ? new Date(p.licenseExpiry) : null,
    });
    res.json({ success: true, data: { ...c, emailVerified: !!c.emailVerifiedAt, mobileVerified: !!c.mobileVerifiedAt } });
  } catch (e) { next(e); }
};

const paySchema = z.object({ type: z.enum(['advance', 'full']) });
export const payBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const b = await ownedBooking(String(req.params.id), req.customer!.customerId);
    if (b.bookingStatus === 'CANCELLED') throw new AppError(400, 'This booking is cancelled');
    const { type } = paySchema.parse(req.body);
    const balanceDue = b.invoice.balanceDue;
    if (balanceDue <= 0) throw new AppError(400, 'This booking is already fully paid');
    const amount = type === 'advance'
      ? Math.min(balanceDue, Math.round(b.invoice.grandTotal * 0.25 * 100) / 100)
      : balanceDue;
    // Mock gateway: create an order then record the captured payment.
    const order = await payments.createOrder(amount, b.id);
    await prisma.payment.create({
      data: { bookingId: b.id, amount, paymentMethod: 'CARD', notes: `[Online ${type}] order ${order.id}${('mock' in order && order.mock) ? ' (mock)' : ''}` },
    });
    const updated = await bookingService.getBookingById(b.id);
    res.json({ success: true, data: { invoice: updated.invoice, mock: ('mock' in order ? order.mock : false) } });
  } catch (e) { next(e); }
};

// Gateway webhook (scaffold). Real provider posts here; verify + record.
export const paymentsWebhook = async (req: Request, res: Response) => {
  const ok = payments.verifyPaymentSignature(req.body ?? {});
  // TODO: when real, look up the order, record the Payment if not already recorded.
  res.json({ received: true, verified: ok });
};
