import { Request, Response, NextFunction } from 'express';
import * as customerService from '../services/customer.service';
import { z } from 'zod';

const createCustomerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7),
  licenseNo: z.string().min(1),
  address: z.string().optional(),
});

export const getCustomers = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await customerService.getAllCustomers() }); } catch (e) { next(e); }
};

export const getCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await customerService.getCustomerById(String(req.params.id)) }); } catch (e) { next(e); }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json({ success: true, data: await customerService.createCustomer(createCustomerSchema.parse(req.body)) }); } catch (e) { next(e); }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await customerService.updateCustomer(String(req.params.id), req.body) }); } catch (e) { next(e); }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try { await customerService.deleteCustomer(String(req.params.id)); res.json({ success: true, message: 'Customer deleted' }); } catch (e) { next(e); }
};
