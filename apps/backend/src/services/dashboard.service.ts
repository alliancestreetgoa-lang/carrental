import { prisma } from '../lib/prisma';

export const getDashboardStats = async () => {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [
    totalCars,
    availableCars,
    bookedCars,
    maintenanceCars,
    totalCustomers,
    activeBookings,
    monthlyRevenue,
    monthlyExpenses,
    recentBookings,
  ] = await Promise.all([
    prisma.car.count({ where: { deletedAt: null } }),
    prisma.car.count({ where: { deletedAt: null, status: 'AVAILABLE' } }),
    prisma.car.count({ where: { deletedAt: null, status: 'BOOKED' } }),
    prisma.car.count({ where: { deletedAt: null, status: 'MAINTENANCE' } }),
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.booking.count({ where: { deletedAt: null, bookingStatus: { in: ['RESERVED', 'ACTIVE'] } } }),
    prisma.payment.aggregate({
      where: { deletedAt: null, paymentDate: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { deletedAt: null, expenseDate: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.booking.findMany({
      where: { deletedAt: null },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { fullName: true } },
        car: { select: { carName: true, brand: true, registrationNumber: true } },
      },
    }),
  ]);

  return {
    totalCars,
    availableCars,
    bookedCars,
    maintenanceCars,
    totalCustomers,
    activeBookings,
    monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
    monthlyExpenses: monthlyExpenses._sum.amount ?? 0,
    recentBookings,
  };
};
