import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { carDocumentExpiries, expiryThresholdFrom } from '../lib/expiryAlerts';
import { MaintenanceType, MaintenanceStatus, ExpenseCategory, Prisma, Maintenance } from '@prisma/client';

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
    expenseDate: record.serviceDate ?? record.createdAt,
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

// Reconciles the linked expense for an already-written record and returns it
// with its car included. Takes the freshly created/updated row so callers
// don't pay an extra read.
const applySync = async (record: Maintenance) => {
  const expenseId = await syncExpense(record);
  if (expenseId !== record.expenseId) {
    return prisma.maintenance.update({ where: { id: record.id }, data: { expenseId }, include: carInclude });
  }
  return prisma.maintenance.findUnique({ where: { id: record.id }, include: carInclude });
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
  const expiryThreshold = expiryThresholdFrom(now);

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

  const expiryAlerts = alertCars
    .flatMap((c) =>
      carDocumentExpiries(c, now).map((e) => ({
        carId: c.id,
        carLabel: `${c.brand} ${c.carName}`,
        registrationNumber: c.registrationNumber,
        kind: e.kind,
        date: e.date,
        detail: e.detail,
        expired: e.expired,
      }))
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

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
  return applySync(created);
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
  const updated = await prisma.maintenance.update({ where: { id }, data });
  return applySync(updated);
};

export const markComplete = async (
  id: string,
  data: { serviceDate?: Date; odometer?: number; cost?: number }
) => {
  const record = await prisma.maintenance.findFirst({ where: { id, deletedAt: null } });
  if (!record) throw new AppError(404, 'Maintenance record not found');
  const updated = await prisma.maintenance.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      serviceDate: data.serviceDate ?? new Date(),
      ...(data.odometer !== undefined ? { odometer: data.odometer } : {}),
      ...(data.cost !== undefined ? { cost: data.cost } : {}),
    },
  });
  return applySync(updated);
};

export const deleteMaintenance = async (id: string) => {
  const record = await prisma.maintenance.findFirst({ where: { id, deletedAt: null } });
  if (!record) throw new AppError(404, 'Maintenance record not found');
  if (record.expenseId) {
    await prisma.expense.updateMany({ where: { id: record.expenseId, deletedAt: null }, data: { deletedAt: new Date() } });
  }
  return prisma.maintenance.update({ where: { id }, data: { deletedAt: new Date() } });
};
