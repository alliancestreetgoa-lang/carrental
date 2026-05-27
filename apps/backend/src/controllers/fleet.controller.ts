import { Request, Response, NextFunction } from 'express';
import * as fleetService from '../services/fleet.service';
import { z } from 'zod';

const createCarSchema = z.object({
  plate: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  color: z.string().min(1),
  categoryId: z.string(),
  mileage: z.number().optional(),
  imageUrl: z.string().url().optional(),
});

export const getCars = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await fleetService.getAllCars() }); } catch (e) { next(e); }
};

export const getCar = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await fleetService.getCarById(String(req.params.id)) }); } catch (e) { next(e); }
};

export const createCar = async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json({ success: true, data: await fleetService.createCar(createCarSchema.parse(req.body)) }); } catch (e) { next(e); }
};

export const updateCar = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await fleetService.updateCar(String(req.params.id), req.body) }); } catch (e) { next(e); }
};

export const deleteCar = async (req: Request, res: Response, next: NextFunction) => {
  try { await fleetService.deleteCar(String(req.params.id)); res.json({ success: true, message: 'Car deleted' }); } catch (e) { next(e); }
};
