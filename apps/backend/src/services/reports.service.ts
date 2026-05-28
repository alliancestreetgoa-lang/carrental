import { prisma } from '../lib/prisma';

const DAY_MS = 1000 * 60 * 60 * 24;

export const getReport = async (fromInput?: Date, toInput?: Date) => {
  const to = toInput ?? new Date();
  const from = fromInput ?? new Date(to.getFullYear(), to.getMonth() - 5, 1);

  const [carCount, payments, expenses, rangeBookings, overlapBookings, statusGroups] = await Promise.all([
    prisma.car.count({ where: { deletedAt: null } }),
    prisma.payment.findMany({
      where: { deletedAt: null, paymentDate: { gte: from, lte: to } },
      select: { amount: true, paymentDate: true, booking: { select: { customerId: true, customer: { select: { fullName: true } } } } },
    }),
    prisma.expense.findMany({
      where: { deletedAt: null, expenseDate: { gte: from, lte: to } },
      select: { amount: true, expenseDate: true },
    }),
    prisma.booking.findMany({
      where: { deletedAt: null, createdAt: { gte: from, lte: to } },
      select: {
        totalAmount: true, carId: true,
        car: { select: { carName: true, brand: true, registrationNumber: true } },
      },
    }),
    prisma.booking.findMany({
      where: { deletedAt: null, bookingStatus: { not: 'CANCELLED' }, pickupDate: { lte: to }, returnDate: { gte: from } },
      select: { pickupDate: true, returnDate: true },
    }),
    prisma.booking.groupBy({
      by: ['bookingStatus'],
      where: { deletedAt: null, createdAt: { gte: from, lte: to } },
      _count: { _all: true },
    }),
  ]);

  // Month buckets across the range (cap 12)
  const buckets: { key: string; label: string }[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  while (cursor <= to && buckets.length < 12) {
    buckets.push({ key: `${cursor.getFullYear()}-${cursor.getMonth()}`, label: cursor.toLocaleString('en-US', { month: 'short', year: '2-digit' }) });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const bucketKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const revMap = new Map(buckets.map((b) => [b.key, 0]));
  const expMap = new Map(buckets.map((b) => [b.key, 0]));
  for (const p of payments) { const k = bucketKey(p.paymentDate); if (revMap.has(k)) revMap.set(k, revMap.get(k)! + Number(p.amount)); }
  for (const e of expenses) { const k = bucketKey(e.expenseDate); if (expMap.has(k)) expMap.set(k, expMap.get(k)! + Number(e.amount)); }
  const revenueByMonth = buckets.map((b) => ({ month: b.label, revenue: revMap.get(b.key)!, expenses: expMap.get(b.key)! }));

  const revenue = payments.reduce((s, p) => s + Number(p.amount), 0);
  const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const bookingsCount = rangeBookings.length;
  const bookingValueTotal = rangeBookings.reduce((s, b) => s + Number(b.totalAmount), 0);

  // Top cars by revenue (booking totalAmount) within range
  const carAgg = new Map<string, { label: string; registrationNumber: string; bookings: number; revenue: number }>();
  for (const b of rangeBookings) {
    const cur = carAgg.get(b.carId) ?? { label: `${b.car.brand} ${b.car.carName}`, registrationNumber: b.car.registrationNumber, bookings: 0, revenue: 0 };
    cur.bookings += 1;
    cur.revenue += Number(b.totalAmount);
    carAgg.set(b.carId, cur);
  }
  const topCars = [...carAgg.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Top customers by payments within range
  const custAgg = new Map<string, { name: string; spent: number }>();
  for (const p of payments) {
    const cid = p.booking.customerId;
    const cur = custAgg.get(cid) ?? { name: p.booking.customer.fullName, spent: 0 };
    cur.spent += Number(p.amount);
    custAgg.set(cid, cur);
  }
  const topCustomers = [...custAgg.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  // Fleet utilization: booked car-days / (cars × range-days)
  const rangeDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / DAY_MS));
  let bookedDays = 0;
  for (const b of overlapBookings) {
    const start = Math.max(b.pickupDate.getTime(), from.getTime());
    const end = Math.min(b.returnDate.getTime(), to.getTime());
    if (end > start) bookedDays += (end - start) / DAY_MS;
  }
  const utilization = carCount > 0 ? Math.min(100, Math.round((bookedDays / (carCount * rangeDays)) * 1000) / 10) : 0;

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    totals: {
      revenue,
      expenses: expenseTotal,
      profit: revenue - expenseTotal,
      bookings: bookingsCount,
      avgBookingValue: bookingsCount > 0 ? Math.round((bookingValueTotal / bookingsCount) * 100) / 100 : 0,
      utilization,
    },
    revenueByMonth,
    statusMix: statusGroups.map((g) => ({ status: g.bookingStatus, count: g._count._all })),
    topCars,
    topCustomers,
  };
};
