import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { PaymentMethod } from '@prisma/client';

export const getAllPayments = (bookingId?: string) =>
  prisma.payment.findMany({
    where: { deletedAt: null, ...(bookingId ? { bookingId } : {}) },
    include: { booking: { select: { id: true, customer: { select: { fullName: true } } } } },
    orderBy: { paymentDate: 'desc' },
  });

export const createPayment = async (data: {
  bookingId: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  paymentDate?: Date;
  notes?: string;
}) => {
  const booking = await prisma.booking.findFirst({ where: { id: data.bookingId, deletedAt: null } });
  if (!booking) throw new AppError(404, 'Booking not found');
  return prisma.payment.create({ data });
};

export const deletePayment = async (id: string) => {
  const payment = await prisma.payment.findFirst({ where: { id, deletedAt: null } });
  if (!payment) throw new AppError(404, 'Payment not found');
  return prisma.payment.update({ where: { id }, data: { deletedAt: new Date() } });
};
