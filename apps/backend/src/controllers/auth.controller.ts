import { Request, Response, NextFunction } from 'express';
import { loginService, getMeService } from '../services/auth.service';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const { token, user } = await loginService(email, password);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out' });
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getMeService(req.user!.userId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
