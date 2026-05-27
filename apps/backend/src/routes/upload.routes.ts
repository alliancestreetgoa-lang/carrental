import { Router } from 'express';
import { uploadImage, uploadMiddleware } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.post('/image', authenticate, uploadMiddleware, uploadImage);

export default router;
