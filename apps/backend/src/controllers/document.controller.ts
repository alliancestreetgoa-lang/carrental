import { Request, Response, NextFunction } from 'express';
import * as documentService from '../services/document.service';
import { z } from 'zod';

const createDocumentSchema = z.object({
  type: z.enum(['LICENSE', 'AADHAAR', 'RC', 'INSURANCE', 'POLLUTION', 'PHOTO', 'OTHER']),
  fileUrl: z.string().url(),
  customerId: z.string().min(1).optional(),
  carId: z.string().min(1).optional(),
});

export const getDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.query.customerId ? String(req.query.customerId) : undefined;
    const carId = req.query.carId ? String(req.query.carId) : undefined;
    res.json({ success: true, data: await documentService.getAllDocuments({ customerId, carId }) });
  } catch (e) { next(e); }
};

export const createDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json({ success: true, data: await documentService.createDocument(createDocumentSchema.parse(req.body)) });
  } catch (e) { next(e); }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await documentService.deleteDocument(String(req.params.id));
    res.json({ success: true, message: 'Document deleted' });
  } catch (e) { next(e); }
};
