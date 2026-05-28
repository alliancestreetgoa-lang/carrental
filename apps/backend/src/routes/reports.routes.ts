import { Router } from 'express';
import { getReport, getProfitPerCar, getProfitPerCarPdf } from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = Router();
router.use(authenticate, authorize('SUPER_ADMIN', 'ACCOUNTANT'));

router.get('/', getReport);
router.get('/profit-per-car', getProfitPerCar);
router.get('/profit-per-car/pdf', getProfitPerCarPdf);

export default router;
