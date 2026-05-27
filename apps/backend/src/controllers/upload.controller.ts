import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AppError } from '../middleware/error.middleware';
import { cloudinaryConfigured, uploadBuffer } from '../lib/cloudinary';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new AppError(400, 'Only image files are allowed'));
  },
});

export const uploadMiddleware = upload.single('file');

export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!cloudinaryConfigured) {
      throw new AppError(503, 'Image upload is not configured. Set CLOUDINARY_* env vars.');
    }
    if (!req.file) throw new AppError(400, 'No file provided');
    const url = await uploadBuffer(req.file.buffer);
    res.json({ success: true, data: { url } });
  } catch (e) {
    next(e);
  }
};
