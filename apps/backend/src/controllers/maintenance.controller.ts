import { Request, Response, NextFunction } from 'express';
import * as maintenanceService from '../services/maintenance.service';
import { emitRealtime } from '../socket';
import { z } from 'zod';

const typeEnum = z.enum(['SERVICE', 'OIL_CHANGE', 'TYRE', 'BRAKES', 'BATTERY', 'REPAIR', 'INSPECTION', 'CLEANING', 'OTHER']);
const statusEnum = z.enum(['SCHEDULED', 'COMPLETED']);

const createSchema = z.object({
  carId: z.string().min(1),
  type: typeEnum.optional(),
  status: statusEnum.optional(),
  serviceDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  odometer: z.number().int().nonnegative().optional(),
  cost: z.number().nonnegative().optional(),
  serviceCenter: z.string().optional(),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  type: typeEnum.optional(),
  status: statusEnum.optional(),
  serviceDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  odometer: z.number().int().nonnegative().optional(),
  cost: z.number().nonnegative().optional(),
  serviceCenter: z.string().optional(),
  notes: z.string().optional(),
});

const completeSchema = z.object({
  serviceDate: z.string().optional(),
  odometer: z.number().int().nonnegative().optional(),
  cost: z.number().nonnegative().optional(),
});

const listQuerySchema = z.object({
  carId: z.string().optional(),
  type: typeEnum.optional(),
  status: statusEnum.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const toDate = (v?: string | null) => (v ? new Date(v) : v === null ? null : undefined);

export const getMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = listQuerySchema.parse(req.query);
    const data = await maintenanceService.getAllMaintenance({
      carId: q.carId,
      type: q.type,
      status: q.status,
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const getSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await maintenanceService.getMaintenanceSummary() });
  } catch (e) { next(e); }
};

export const createMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = createSchema.parse(req.body);
    const data = await maintenanceService.createMaintenance({
      ...p,
      serviceDate: p.serviceDate ? new Date(p.serviceDate) : undefined,
      dueDate: p.dueDate ? new Date(p.dueDate) : undefined,
    });
    emitRealtime('maintenance:changed', { id: data?.id });
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
};

export const updateMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = updateSchema.parse(req.body);
    const data = await maintenanceService.updateMaintenance(String(req.params.id), {
      ...p,
      serviceDate: toDate(p.serviceDate),
      dueDate: toDate(p.dueDate),
    });
    emitRealtime('maintenance:changed', { id: String(req.params.id) });
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const completeMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = completeSchema.parse(req.body);
    const data = await maintenanceService.markComplete(String(req.params.id), {
      ...p,
      serviceDate: p.serviceDate ? new Date(p.serviceDate) : undefined,
    });
    emitRealtime('maintenance:changed', { id: String(req.params.id) });
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const deleteMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await maintenanceService.deleteMaintenance(String(req.params.id));
    emitRealtime('maintenance:changed', { id: String(req.params.id) });
    res.json({ success: true, message: 'Maintenance record deleted' });
  } catch (e) { next(e); }
};
