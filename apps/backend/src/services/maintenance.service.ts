import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { MaintenanceType, MaintenanceStatus, ExpenseCategory, Prisma, Maintenance } from '@prisma/client';

const DAY_MS = 24 * 60 * 60 * 1000;
const carInclude = { car: { select: { carName: true, brand: true, registrationNumber: true } } };

// Maintenance cost is mirrored into the expense ledger so it flows into
// expenses/profit — the ledger stays the single source of financial truth.
const EXPENSE_CATEGORY: Record<MaintenanceType, ExpenseCategory> = {
  SERVICE: 'SERVICE',
  OIL_CHANGE: 'SERVICE',
  INSPECTION: 'SERVICE',
  REPAIR: 'REPAIR',
  TYRE: 'REPAIR',
  BRAKES: 'REPAIR',
  BATTERY: 'REPAIR',
  CLEANING: 'CLEANING',
  OTHER: 'OTHER',
};

const syncExpense = async (record: Maintenance): Promise<string | null> => {
  const cost = Number(record.cost);
  const wantExpense = record.status === 'COMPLETED' && cost > 0;

  if (!wantExpense) {
    if (record.expenseId) {
      await prisma.expense.updateMany({
        where: { id: record.expenseId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    }
    return null;
  }

  const label = `[Maintenance] ${record.type}${record.serviceCenter ? ` @ ${record.serviceCenter}` : ''}`;
  const expenseData = {
    carId: record.carId,
    amount: cost,
    category: EXPENSE_CATEGORY[record.type],
    expenseDate: record.serviceDate ?? record.updatedAt,
    notes: record.notes ? `${label} — ${record.notes}` : label,
  };

  if (record.expenseId) {
    const existing = await prisma.expense.findFirst({ where: { id: record.expenseId, deletedAt: null } });
    if (existing) {
      await prisma.expense.update({ where: { id: record.expenseId }, data: expenseData });
      return record.expenseId;
    }
  }
  const created = await prisma.expense.create({ data: expenseData });
  return created.id;
};

const applySync = async (id: string) => {
  const record = await prisma.maintenance.findUniqueOrThrow({ where: { id } });
  const expenseId = await syncExpense(record);
  if (expenseId !== record.expenseId) {
    await prisma.maintenance.update({ where: { id }, data: { expenseId } });
  }
  return prisma.maintenance.findUnique({ where: { id }, include: carInclude });
};

export const getAllMaintenance = (
  filters: { carId?: string; type?: MaintenanceType; status?: MaintenanceStatus; from?: Date; to?: Date } = {}
) => {
  const where: Prisma.MaintenanceWhereInput = {
    deletedAt: null,
    ...(filters.carId ? { carId: filters.carId } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.from || filters.to
      ? { serviceDate: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } }
      : {}),
  };
  return prisma.maintenance.findMany({
    where,
    include: carInclude,
    orderBy: [{ serviceDate: 'desc' }, { dueDate: 'desc' }, { createdAt: 'desc' }],
  });
};

export const getMaintenanceSummary = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const expiryThreshold = new Date(now.getTime() + 30 * DAY_MS);

  const [scheduled, completed, alertCars] = await Promise.all([
    prisma.maintenance.findMany({
      where: { deletedAt: null, status: 'SCHEDULED' },
      include: carInclude,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.maintenance.findMany({
      where: { deletedAt: null, status: 'COMPLETED' },
      select: { cost: true, serviceDate: true },
    }),
    prisma.car.findMany({
      where: {
        deletedAt: null,
        OR: [
          { insuranceExpiry: { lte: expiryThreshold } },
          { pollutionExpiry: { lte: expiryThreshold } },
          { rcExpiry: { lte: expiryThreshold } },
        ],
      },
      select: {
        id: true, carName: true, brand: true, registrationNumber: true,
        insuranceExpiry: true, pollutionExpiry: true, rcExpiry: true,
      },
    }),
  ]);

  const upcoming = scheduled.map((m) => ({
    id: m.id,
    carId: m.carId,
    carLabel: `${m.car.brand} ${m.car.carName}`,
    registrationNumber: m.car.registrationNumber,
    type: m.type,
    dueDate: m.dueDate,
    notes: m.notes,
    overdue: !!m.dueDate && m.dueDate < now,
  }));
  const overdueCount = upcoming.filter((u) => u.overdue).length;

  let totalCost = 0;
  let completedThisMonth = 0;
  for (const c of completed) {
    totalCost += Number(c.cost);
    if (c.serviceDate && c.serviceDate >= startOfMonth) completedThisMonth += 1;
  }

  const daysUntil = (d: Date) => Math.ceil((d.getTime() - now.getTime()) / DAY_MS);
  const expiryDetail = (d: Date) => {
    const days = daysUntil(d);
    return days < 0 ? `Expired ${Math.abs(days)}d ago` : `Expires in ${days}d`;
  };
  const expiryAlerts: Array<{
    carId: string; carLabel: string; registrationNumber: string;
    kind: 'INSURANCE' | 'POLLUTION' | 'RC'; date: Date; detail: string; expired: boolean;
  }> = [];
  for (const c of alertCars) {
    const base = { carId: c.id, carLabel: `${c.brand} ${c.carName}`, registrationNumber: c.registrationNumber };
    if (c.insuranceExpiry && c.insuranceExpiry <= expiryThreshold)
      expiryAlerts.push({ ...base, kind: 'INSURANCE', date: c.insuranceExpiry, detail: `Insurance ${expiryDetail(c.insuranceExpiry)}`, expired: c.insuranceExpiry < now });
    if (c.pollutionExpiry && c.pollutionExpiry <= expiryThreshold)
      expiryAlerts.push({ ...base, kind: 'POLLUTION', date: c.pollutionExpiry, detail: `Pollution ${expiryDetail(c.pollutionExpiry)}`, expired: c.pollutionExpiry < now });
    if (c.rcExpiry && c.rcExpiry <= expiryThreshold)
      expiryAlerts.push({ ...base, kind: 'RC', date: c.rcExpiry, detail: `RC ${expiryDetail(c.rcExpiry)}`, expired: c.rcExpiry < now });
  }
  expiryAlerts.sort((a, b) => a.date.getTime() - b.date.getTime());

  return { upcomingCount: upcoming.length, overdueCount, completedThisMonth, totalCost, upcoming, expiryAlerts };
};

export const createMaintenance = async (data: {
  carId: string;
  type?: MaintenanceType;
  status?: MaintenanceStatus;
  serviceDate?: Date;
  dueDate?: Date;
  odometer?: number;
  cost?: number;
  serviceCenter?: string;
  notes?: string;
}) => {
  const car = await prisma.car.findFirst({ where: { id: data.carId, deletedAt: null } });
  if (!car) throw new AppError(404, 'Car not found');
  const created = await prisma.maintenance.create({ data });
  return applySync(created.id);
};

export const updateMaintenance = async (
  id: string,
  data: {
    type?: MaintenanceType;
    status?: MaintenanceStatus;
    serviceDate?: Date | null;
    dueDate?: Date | null;
    odometer?: number;
    cost?: number;
    serviceCenter?: string;
    notes?: string;
  }
) => {
  const record = await prisma.maintenance.findFirst({ where: { id, deletedAt: null } });
  if (!record) throw new AppError(404, 'Maintenance record not found');
  await prisma.maintenance.update({ where: { id }, data });
  return applySync(id);
};

export const markComplete = async (
  id: string,
  data: { serviceDate?: Date; odometer?: number; cost?: number }
) => {
  const record = await prisma.maintenance.findFirst({ where: { id, deletedAt: null } });
  if (!record) throw new AppError(404, 'Maintenance record not found');
  await prisma.maintenance.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      serviceDate: data.serviceDate ?? new Date(),
      ...(data.odometer !== undefined ? { odometer: data.odometer } : {}),
      ...(data.cost !== undefined ? { cost: data.cost } : {}),
    },
  });
  return applySync(id);
};

export const deleteMaintenance = async (id: string) => {
  const record = await prisma.maintenance.findFirst({ where: { id, deletedAt: null } });
  if (!record) throw new AppError(404, 'Maintenance record not found');
  if (record.expenseId) {
    await prisma.expense.updateMany({ where: { id: record.expenseId, deletedAt: null }, data: { deletedAt: new Date() } });
  }
  return prisma.maintenance.update({ where: { id }, data: { deletedAt: new Date() } });
};
