import { Router } from 'express';
import * as customerController from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = Router();
router.use(authenticate);
router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomer);
router.post('/', authorize('SUPER_ADMIN', 'STAFF'), customerController.createCustomer);
router.patch('/:id', authorize('SUPER_ADMIN', 'STAFF'), customerController.updateCustomer);
router.delete('/:id', authorize('SUPER_ADMIN'), customerController.deleteCustomer);

export default router;
