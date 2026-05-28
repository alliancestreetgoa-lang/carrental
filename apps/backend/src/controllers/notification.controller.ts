import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service';

export const getNotifications = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await notificationService.getNotifications();
    res.json({ success: true, data });
  } catch (e) { next(e); }
};
