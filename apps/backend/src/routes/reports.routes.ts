import { Router } from 'express';
import { getReport } from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = Router();
router.get('/', authenticate, authorize('SUPER_ADMIN', 'ACCOUNTANT'), getReport);

export default router;
