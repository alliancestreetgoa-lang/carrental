import { Request, Response, NextFunction } from 'express';
import * as agreementService from '../services/agreement.service';
import { z } from 'zod';

const createAgreementSchema = z.object({
  bookingId: z.string().min(1),
  agreementNumber: z.string().min(1),
  pdfUrl: z.string().url().optional(),
});

const updateAgreementSchema = z.object({
  pdfUrl: z.string().url().optional(),
  signed: z.boolean().optional(),
  signedAt: z.string().datetime().optional(),
});

export const getAgreements = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await agreementService.getAllAgreements() }); } catch (e) { next(e); }
};

export const getAgreement = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await agreementService.getAgreementById(String(req.params.id)) }); } catch (e) { next(e); }
};

export const createAgreement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json({ success: true, data: await agreementService.createAgreement(createAgreementSchema.parse(req.body)) });
  } catch (e) { next(e); }
};

export const updateAgreement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateAgreementSchema.parse(req.body);
    const data = { ...parsed, signedAt: parsed.signedAt ? new Date(parsed.signedAt) : undefined };
    res.json({ success: true, data: await agreementService.updateAgreement(String(req.params.id), data) });
  } catch (e) { next(e); }
};

export const deleteAgreement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await agreementService.deleteAgreement(String(req.params.id));
    res.json({ success: true, message: 'Agreement deleted' });
  } catch (e) { next(e); }
};
