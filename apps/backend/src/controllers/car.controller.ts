import { Request, Response, NextFunction } from 'express';
import * as carService from '../services/car.service';
import { z } from 'zod';

const carBaseSchema = z.object({
  carName: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1980).max(new Date().getFullYear() + 1),
  registrationNumber: z.string().min(1),
  chassisNumber: z.string().min(1),
  fuelType: z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG', 'LPG']).optional(),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']).optional(),
  seatingCapacity: z.number().int().min(1).max(50).optional(),
  dailyRent: z.number().nonnegative(),
  weeklyRent: z.number().nonnegative().optional(),
  monthlyRent: z.number().nonnegative().optional(),
  securityDeposit: z.number().nonnegative().optional(),
  insuranceExpiry: z.string().datetime().optional(),
  pollutionExpiry: z.string().datetime().optional(),
  rcExpiry: z.string().datetime().optional(),
  currentKilometer: z.number().int().nonnegative().optional(),
  status: z.enum(['AVAILABLE', 'BOOKED', 'MAINTENANCE', 'OUT_OF_SERVICE']).optional(),
});

const updateCarSchema = carBaseSchema.partial();

export const getCars = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await carService.getAllCars() }); } catch (e) { next(e); }
};

export const getCar = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await carService.getCarById(String(req.params.id)) }); } catch (e) { next(e); }
};

export const createCar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = carBaseSchema.parse(req.body);
    const data = {
      ...parsed,
      insuranceExpiry: parsed.insuranceExpiry ? new Date(parsed.insuranceExpiry) : undefined,
      pollutionExpiry: parsed.pollutionExpiry ? new Date(parsed.pollutionExpiry) : undefined,
      rcExpiry: parsed.rcExpiry ? new Date(parsed.rcExpiry) : undefined,
    };
    res.status(201).json({ success: true, data: await carService.createCar(data) });
  } catch (e) { next(e); }
};

export const updateCar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateCarSchema.parse(req.body);
    const data = {
      ...parsed,
      insuranceExpiry: parsed.insuranceExpiry ? new Date(parsed.insuranceExpiry) : undefined,
      pollutionExpiry: parsed.pollutionExpiry ? new Date(parsed.pollutionExpiry) : undefined,
      rcExpiry: parsed.rcExpiry ? new Date(parsed.rcExpiry) : undefined,
    };
    res.json({ success: true, data: await carService.updateCar(String(req.params.id), data) });
  } catch (e) { next(e); }
};

export const deleteCar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await carService.deleteCar(String(req.params.id));
    res.json({ success: true, message: 'Car deleted' });
  } catch (e) { next(e); }
};
