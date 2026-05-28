import { Request, Response, NextFunction } from 'express';
import * as agreementService from '../services/agreement.service';
import { streamAgreementPdf } from '../lib/agreementPdf';
import { emitRealtime } from '../socket';
import { z } from 'zod';

const createAgreementSchema = z.object({
  bookingId: z.string().min(1),
  agreementNumber: z.string().min(1).optional(),
});

const updateAgreementSchema = z.object({
  pdfUrl: z.string().url().optional(),
  signed: z.boolean().optional(),
  signedAt: z.string().datetime().optional(),
});

const signSchema = z.object({
  signatureData: z.string().min(1).refine((s) => s.startsWith('data:image/'), 'Invalid signature image'),
  signatoryName: z.string().optional(),
});

export const getAgreements = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await agreementService.getAllAgreements() }); } catch (e) { next(e); }
};

export const getAgreement = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await agreementService.getAgreementById(String(req.params.id)) }); } catch (e) { next(e); }
};

export const createAgreement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = await agreementService.createAgreement(createAgreementSchema.parse(req.body));
    emitRealtime('booking:updated', { id: created.bookingId });
    res.status(201).json({ success: true, data: created });
  } catch (e) { next(e); }
};

export const signAgreement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { signatureData, signatoryName } = signSchema.parse(req.body);
    const signed = await agreementService.signAgreement(String(req.params.id), signatureData, signatoryName);
    emitRealtime('booking:updated', { id: signed.bookingId });
    res.json({ success: true, data: signed });
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

export const getAgreementPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const a = await agreementService.getAgreementById(String(req.params.id));
    streamAgreementPdf(res, a);
  } catch (e) { next(e); }
};
