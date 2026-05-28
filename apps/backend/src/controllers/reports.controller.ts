import { Request, Response, NextFunction } from 'express';
import * as reportsService from '../services/reports.service';
import { z } from 'zod';

const querySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const getReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = querySchema.parse(req.query);
    const data = await reportsService.getReport(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined
    );
    res.json({ success: true, data });
  } catch (e) { next(e); }
};
