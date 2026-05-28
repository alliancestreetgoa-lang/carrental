import { prisma } from '../lib/prisma';
import { carDocumentExpiries, expiryThresholdFrom } from '../lib/expiryAlerts';

const bookingCardSelect = {
  id: true,
  pickupDate: true,
  returnDate: true,
  totalAmount: true,
  bookingStatus: true,
  customer: { select: { fullName: true } },
  car: { select: { carName: true, brand: true, registrationNumber: true } },
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const getDashboardStats = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const todayStart = startOfDay(now);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const expiryThreshold = expiryThresholdFrom(now);

  // Build the last 6 month buckets (oldest -> current)
  const monthBuckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-US', { month: 'short' }) };
  });
  const bucketKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

  const [
    totalCars,
    availableCars,
    activeRentals,
    totalCustomers,
    utilizationGroups,
    paymentsWindow,
    bookingsWindow,
    openBookings,
    recentBookings,
    carsDueToday,
    pendingReturns,
    alertCars,
  ] = await Promise.all([
    prisma.car.count({ where: { deletedAt: null } }),
    prisma.car.count({ where: { deletedAt: null, status: 'AVAILABLE' } }),
    prisma.booking.count({ where: { deletedAt: null, bookingStatus: 'ACTIVE' } }),
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.car.groupBy({ by: ['status'], where: { deletedAt: null }, _count: { _all: true } }),
    prisma.payment.findMany({
      where: { deletedAt: null, paymentDate: { gte: sixMonthsAgo } },
      select: { amount: true, paymentDate: true },
    }),
    prisma.booking.findMany({
      where: { deletedAt: null, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.booking.findMany({
      where: { deletedAt: null, bookingStatus: { not: 'CANCELLED' } },
      select: { totalAmount: true, payments: { where: { deletedAt: null }, select: { amount: true } } },
    }),
    prisma.booking.findMany({
      where: { deletedAt: null },
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: bookingCardSelect,
    }),
    prisma.booking.findMany({
      where: { deletedAt: null, bookingStatus: 'ACTIVE', returnDate: { gte: todayStart, lt: todayEnd } },
      orderBy: { returnDate: 'asc' },
      select: bookingCardSelect,
    }),
    prisma.booking.findMany({
      where: { deletedAt: null, bookingStatus: 'ACTIVE' },
      take: 8,
      orderBy: { returnDate: 'asc' },
      select: bookingCardSelect,
    }),
    prisma.car.findMany({
      where: {
        deletedAt: null,
        OR: [
          { status: 'MAINTENANCE' },
          { insuranceExpiry: { lte: expiryThreshold } },
          { pollutionExpiry: { lte: expiryThreshold } },
          { rcExpiry: { lte: expiryThreshold } },
        ],
      },
      select: {
        id: true, carName: true, brand: true, registrationNumber: true, status: true,
        insuranceExpiry: true, pollutionExpiry: true, rcExpiry: true,
      },
    }),
  ]);

  // Monthly revenue + monthly bookings charts
  const revenueByMonth = new Map(monthBuckets.map((m) => [m.key, 0]));
  for (const p of paymentsWindow) {
    const k = bucketKey(p.paymentDate);
    if (revenueByMonth.has(k)) revenueByMonth.set(k, revenueByMonth.get(k)! + Number(p.amount));
  }
  const monthlyRevenue = monthBuckets.map((m) => ({ month: m.label, revenue: revenueByMonth.get(m.key)! }));

  const bookingsByMonth = new Map(monthBuckets.map((m) => [m.key, 0]));
  for (const b of bookingsWindow) {
    const k = bucketKey(b.createdAt);
    if (bookingsByMonth.has(k)) bookingsByMonth.set(k, bookingsByMonth.get(k)! + 1);
  }
  const bookingsAnalytics = monthBuckets.map((m) => ({ month: m.label, bookings: bookingsByMonth.get(m.key)! }));

  // Car utilization (by status)
  const carUtilization = utilizationGroups.map((g) => ({ status: g.status, count: g._count._all }));

  // Pending payments (outstanding on non-cancelled bookings)
  let pendingPaymentsAmount = 0;
  let pendingPaymentsCount = 0;
  for (const b of openBookings) {
    const paid = b.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const outstanding = Number(b.totalAmount) - paid;
    if (outstanding > 0) {
      pendingPaymentsAmount += outstanding;
      pendingPaymentsCount += 1;
    }
  }

  // Current-month revenue (from the already-fetched window)
  const monthlyRevenueTotal = paymentsWindow
    .filter((p) => p.paymentDate >= startOfMonth)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Maintenance + document-expiry alerts
  const maintenanceAlerts: Array<{
    carId: string; carName: string; brand: string; registrationNumber: string; type: string; detail: string;
  }> = [];
  for (const c of alertCars) {
    const base = { carId: c.id, carName: c.carName, brand: c.brand, registrationNumber: c.registrationNumber };
    if (c.status === 'MAINTENANCE') maintenanceAlerts.push({ ...base, type: 'MAINTENANCE', detail: 'Under maintenance' });
    for (const e of carDocumentExpiries(c, now)) maintenanceAlerts.push({ ...base, type: e.kind, detail: e.detail });
  }

  const pendingReturnsWithFlag = pendingReturns.map((b) => ({ ...b, overdue: b.returnDate < now }));

  return {
    cards: {
      totalCars,
      availableCars,
      activeRentals,
      pendingPaymentsAmount,
      pendingPaymentsCount,
      totalCustomers,
      monthlyRevenue: monthlyRevenueTotal,
    },
    monthlyRevenue,
    bookingsAnalytics,
    carUtilization,
    recentBookings,
    carsDueToday,
    pendingReturns: pendingReturnsWithFlag,
    maintenanceAlerts,
  };
};
