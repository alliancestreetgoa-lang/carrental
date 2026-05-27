import { Router } from 'express';
import * as fleetController from '../controllers/fleet.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', fleetController.getCars);
router.get('/:id', fleetController.getCar);
router.post('/', fleetController.createCar);
router.patch('/:id', fleetController.updateCar);
router.delete('/:id', fleetController.deleteCar);

export default router;
