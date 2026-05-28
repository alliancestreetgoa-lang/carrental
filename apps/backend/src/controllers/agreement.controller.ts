import { Request, Response, NextFunction } from 'express';
import * as agreementService from '../services/agreement.service';
import { streamAgreementPdf, buildAgreementPdfBuffer } from '../lib/agreementPdf';
import { AppError } from '../middleware/error.middleware';
import { cloudinaryConfigured, uploadPdfBuffer } from '../lib/cloudinary';
import { mailConfigured, sendMail } from '../lib/mailer';
import { company } from '../config/company';
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
    const lang = req.query.lang ? String(req.query.lang) : undefined;
    const a = await agreementService.getAgreementById(String(req.params.id));
    streamAgreementPdf(res, a, lang);
  } catch (e) { next(e); }
};

const emailSchema = z.object({ to: z.string().email().optional(), lang: z.string().optional() });

export const emailAgreement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!mailConfigured) throw new AppError(503, 'Email is not configured. Set SMTP_* env vars.');
    const { to, lang } = emailSchema.parse(req.body);
    const a = await agreementService.getAgreementById(String(req.params.id));
    const recipient = to ?? a.booking.customer.email;
    if (!recipient) throw new AppError(400, 'No recipient email — customer has no email on file');

    const pdf = await buildAgreementPdfBuffer(a, lang);
    await sendMail({
      to: recipient,
      subject: `${company.name} — Rental Agreement ${a.agreementNumber}`,
      text: `Dear ${a.booking.customer.fullName},\n\nPlease find attached your rental agreement (${a.agreementNumber}).\n\nRegards,\n${company.name}`,
      attachments: [{ filename: `agreement-${a.agreementNumber}.pdf`, content: pdf, contentType: 'application/pdf' }],
    });
    res.json({ success: true, message: `Agreement emailed to ${recipient}` });
  } catch (e) { next(e); }
};

const storeSchema = z.object({ lang: z.string().optional() });

export const storeAgreementPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!cloudinaryConfigured) throw new AppError(503, 'PDF storage is not configured. Set CLOUDINARY_* env vars.');
    const { lang } = storeSchema.parse(req.body);
    const a = await agreementService.getAgreementById(String(req.params.id));
    const pdf = await buildAgreementPdfBuffer(a, lang);
    const url = await uploadPdfBuffer(pdf, `agreement-${a.agreementNumber}`);
    const updated = await agreementService.setPdfUrl(a.id, url);
    res.json({ success: true, data: { pdfUrl: updated.pdfUrl } });
  } catch (e) { next(e); }
};
