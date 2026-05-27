import { prisma } from '../lib/prisma';

export const getDashboardStats = async () => {
  const [totalCars, availableCars, totalCustomers, activeReservations, recentReservations, monthlyRevenue] = await Promise.all([
    prisma.car.count(),
    prisma.car.count({ where: { status: 'AVAILABLE' } }),
    prisma.customer.count(),
    prisma.reservation.count({ where: { status: { in: ['CONFIRMED', 'ACTIVE'] } } }),
    prisma.reservation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { firstName: true, lastName: true } }, car: { select: { make: true, model: true, plate: true } } },
    }),
    prisma.invoice.aggregate({
      where: { paymentStatus: 'PAID', issuedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      _sum: { amount: true },
    }),
  ]);

  return { totalCars, availableCars, totalCustomers, activeReservations, recentReservations, monthlyRevenue: monthlyRevenue._sum.amount ?? 0 };
};
