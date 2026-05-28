import { Router } from 'express';
import * as maintenanceController from '../controllers/maintenance.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = Router();
router.use(authenticate);

router.get('/', maintenanceController.getMaintenance);
router.get('/summary', maintenanceController.getSummary);
router.post('/', authorize('SUPER_ADMIN', 'STAFF'), maintenanceController.createMaintenance);
router.patch('/:id/complete', authorize('SUPER_ADMIN', 'STAFF'), maintenanceController.completeMaintenance);
router.patch('/:id', authorize('SUPER_ADMIN', 'STAFF'), maintenanceController.updateMaintenance);
router.delete('/:id', authorize('SUPER_ADMIN', 'STAFF'), maintenanceController.deleteMaintenance);

export default router;
