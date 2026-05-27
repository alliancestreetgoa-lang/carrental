import { Router } from 'express';
import * as carController from '../controllers/car.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = Router();
router.use(authenticate);

router.get('/', carController.getCars);

// Bulk routes must be declared before the dynamic ":id" routes
router.patch('/bulk/status', authorize('SUPER_ADMIN', 'STAFF'), carController.bulkUpdateStatus);
router.post('/bulk/delete', authorize('SUPER_ADMIN'), carController.bulkDelete);

router.get('/:id', carController.getCar);
router.post('/', authorize('SUPER_ADMIN', 'STAFF'), carController.createCar);
router.patch('/:id', authorize('SUPER_ADMIN', 'STAFF'), carController.updateCar);
router.delete('/:id', authorize('SUPER_ADMIN'), carController.deleteCar);

export default router;
