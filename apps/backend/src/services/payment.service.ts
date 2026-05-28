import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { PaymentMethod, Prisma } from '@prisma/client';

const paymentInclude = {
  booking: {
    select: {
      id: true,
      customer: { select: { fullName: true } },
      car: { select: { carName: true, brand: true, registrationNumber: true } },
    },
  },
};

export const getAllPayments = (filters: {
  bookingId?: string;
  method?: PaymentMethod;
  from?: Date;
  to?: Date;
  search?: string;
} = {}) => {
  const where: Prisma.PaymentWhereInput = {
    deletedAt: null,
    ...(filters.bookingId ? { bookingId: filters.bookingId } : {}),
    ...(filters.method ? { paymentMethod: filters.method } : {}),
    ...(filters.from || filters.to
      ? { paymentDate: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } }
      : {}),
    ...(filters.search
      ? { booking: { customer: { fullName: { contains: filters.search, mode: 'insensitive' } } } }
      : {}),
  };
  return prisma.payment.findMany({ where, include: paymentInclude, orderBy: { paymentDate: 'desc' } });
};

export const getBillingSummary = async () => {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [totalAgg, monthAgg, byMethodRaw, openBookings] = await Promise.all([
    prisma.payment.aggregate({ where: { deletedAt: null }, _sum: { amount: true }, _count: true }),
    prisma.payment.aggregate({ where: { deletedAt: null, paymentDate: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.payment.groupBy({ by: ['paymentMethod'], where: { deletedAt: null }, _sum: { amount: true } }),
    prisma.booking.findMany({
      where: { deletedAt: null, bookingStatus: { not: 'CANCELLED' } },
      select: { totalAmount: true, lateFee: true, payments: { where: { deletedAt: null }, select: { amount: true } } },
    }),
  ]);

  let outstanding = 0;
  for (const b of openBookings) {
    const grand = Number(b.totalAmount) + Number(b.lateFee);
    const paid = b.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    if (grand - paid > 0) outstanding += grand - paid;
  }

  return {
    totalRevenue: Number(totalAgg._sum.amount ?? 0),
    monthRevenue: Number(monthAgg._sum.amount ?? 0),
    paymentCount: totalAgg._count,
    outstanding,
    byMethod: byMethodRaw.map((m) => ({ method: m.paymentMethod, total: Number(m._sum.amount ?? 0) })),
  };
};

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
