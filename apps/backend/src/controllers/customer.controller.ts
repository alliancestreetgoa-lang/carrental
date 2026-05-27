import { Request, Response, NextFunction } from 'express';
import * as customerService from '../services/customer.service';
import { z } from 'zod';

const createCustomerSchema = z.object({
  fullName: z.string().min(1),
  mobile: z.string().min(7),
  whatsapp: z.string().min(7).optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  licenseNumber: z.string().min(1),
  licenseExpiry: z.string().datetime().optional(),
  aadhaarNumber: z.string().min(1).optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
  blacklisted: z.boolean().optional(),
  blacklistReason: z.string().optional(),
});

const updateCustomerSchema = createCustomerSchema.partial();

const listQuerySchema = z.object({
  search: z.string().optional(),
  blacklisted: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['createdAt', 'fullName']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = listQuerySchema.parse(req.query);
    const result = await customerService.getAllCustomers({
      ...q,
      blacklisted: q.blacklisted === undefined ? undefined : q.blacklisted === 'true',
    });
    res.json({
      success: true,
      data: result.items,
      meta: { total: result.total, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages },
    });
  } catch (e) { next(e); }
};

export const getCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await customerService.getCustomerById(String(req.params.id)) }); } catch (e) { next(e); }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createCustomerSchema.parse(req.body);
    const data = {
      ...parsed,
      licenseExpiry: parsed.licenseExpiry ? new Date(parsed.licenseExpiry) : undefined,
    };
    res.status(201).json({ success: true, data: await customerService.createCustomer(data) });
  } catch (e) { next(e); }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateCustomerSchema.parse(req.body);
    const data = {
      ...parsed,
      licenseExpiry: parsed.licenseExpiry ? new Date(parsed.licenseExpiry) : undefined,
    };
    res.json({ success: true, data: await customerService.updateCustomer(String(req.params.id), data) });
  } catch (e) { next(e); }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await customerService.deleteCustomer(String(req.params.id));
    res.json({ success: true, message: 'Customer deleted' });
  } catch (e) { next(e); }
};
