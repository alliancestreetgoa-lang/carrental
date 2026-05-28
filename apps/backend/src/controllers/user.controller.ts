import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { z } from 'zod';

const roleEnum = z.enum(['SUPER_ADMIN', 'STAFF', 'ACCOUNTANT']);

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  mobile: z.string().optional(),
  role: roleEnum,
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  mobile: z.string().optional(),
  role: roleEnum.optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export const getUsers = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await userService.getAllUsers() }); } catch (e) { next(e); }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json({ success: true, data: await userService.createUser(createSchema.parse(req.body)) });
  } catch (e) { next(e); }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await userService.updateUser(String(req.params.id), updateSchema.parse(req.body)) });
  } catch (e) { next(e); }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.deleteUser(String(req.params.id), req.user!.userId);
    res.json({ success: true, message: 'User deactivated' });
  } catch (e) { next(e); }
};
