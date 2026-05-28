import { prisma } from '../lib/prisma';

export interface Notification {
  id: string;
  type: 'OVERDUE' | 'DUE_TODAY' | 'MAINTENANCE' | 'DOC_EXPIRY';
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  link?: string;
}

const fmt = (d: Date) => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

export const getNotifications = async (): Promise<Notification[]> => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const threshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [overdue, dueToday, alertCars] = await Promise.all([
    prisma.booking.findMany({
      where: { deletedAt: null, bookingStatus: 'ACTIVE', returnDate: { lt: now } },
      orderBy: { returnDate: 'asc' },
      include: { customer: { select: { fullName: true } }, car: { select: { registrationNumber: true } } },
    }),
    prisma.booking.findMany({
      where: { deletedAt: null, bookingStatus: 'ACTIVE', returnDate: { gte: todayStart, lt: todayEnd } },
      include: { customer: { select: { fullName: true } }, car: { select: { registrationNumber: true } } },
    }),
    prisma.car.findMany({
      where: {
        deletedAt: null,
        OR: [
          { status: 'MAINTENANCE' },
          { insuranceExpiry: { lte: threshold } },
          { pollutionExpiry: { lte: threshold } },
          { rcExpiry: { lte: threshold } },
        ],
      },
      select: { id: true, carName: true, brand: true, registrationNumber: true, status: true, insuranceExpiry: true, pollutionExpiry: true, rcExpiry: true },
    }),
  ]);

  const items: Notification[] = [];

  for (const b of overdue) {
    const daysLate = Math.ceil((now.getTime() - b.returnDate.getTime()) / 86400000);
    items.push({
      id: `overdue-${b.id}`, type: 'OVERDUE', severity: 'high',
      title: 'Overdue return',
      detail: `${b.customer.fullName} · ${b.car.registrationNumber} · ${daysLate}d late`,
      link: `/bookings/${b.id}`,
    });
  }
  for (const b of dueToday) {
    items.push({
      id: `due-${b.id}`, type: 'DUE_TODAY', severity: 'medium',
      title: 'Return due today',
      detail: `${b.customer.fullName} · ${b.car.registrationNumber}`,
      link: `/bookings/${b.id}`,
    });
  }
  for (const c of alertCars) {
    const label = `${c.brand} ${c.carName} (${c.registrationNumber})`;
    if (c.status === 'MAINTENANCE') {
      items.push({ id: `maint-${c.id}`, type: 'MAINTENANCE', severity: 'medium', title: 'Vehicle in maintenance', detail: label, link: `/fleet/${c.id}` });
    }
    const checkDoc = (label2: string, d: Date | null) => {
      if (!d || d > threshold) return;
      const days = Math.ceil((d.getTime() - now.getTime()) / 86400000);
      items.push({
        id: `doc-${c.id}-${label2}`, type: 'DOC_EXPIRY', severity: days < 0 ? 'high' : 'low',
        title: `${label2} ${days < 0 ? 'expired' : 'expiring'}`,
        detail: `${label} · ${fmt(d)}`,
        link: `/fleet/${c.id}`,
      });
    };
    checkDoc('Insurance', c.insuranceExpiry);
    checkDoc('Pollution', c.pollutionExpiry);
    checkDoc('RC', c.rcExpiry);
  }

  const order = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => order[a.severity] - order[b.severity]);
};
