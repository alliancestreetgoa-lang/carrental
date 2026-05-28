import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = Router();
router.use(authenticate);

router.get('/', paymentController.getPayments);
router.get('/summary', paymentController.getSummary);
router.post('/', authorize('SUPER_ADMIN', 'ACCOUNTANT'), paymentController.createPayment);
router.delete('/:id', authorize('SUPER_ADMIN', 'ACCOUNTANT'), paymentController.deletePayment);

export default router;
