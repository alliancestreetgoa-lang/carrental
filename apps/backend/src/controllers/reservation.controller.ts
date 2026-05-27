import { Request, Response, NextFunction } from 'express';
import * as reservationService from '../services/reservation.service';
import { z } from 'zod';

const createReservationSchema = z.object({
  customerId: z.string(),
  carId: z.string(),
  startDate: z.string().transform((v) => new Date(v)),
  endDate: z.string().transform((v) => new Date(v)),
  notes: z.string().optional(),
});

export const getReservations = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await reservationService.getAllReservations() }); } catch (e) { next(e); }
};

export const createReservation = async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json({ success: true, data: await reservationService.createReservation(createReservationSchema.parse(req.body)) }); } catch (e) { next(e); }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await reservationService.updateReservationStatus(String(req.params.id), req.body.status) }); } catch (e) { next(e); }
};
