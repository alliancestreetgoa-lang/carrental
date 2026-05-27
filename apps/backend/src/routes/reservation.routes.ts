import { Router } from 'express';
import * as reservationController from '../controllers/reservation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', reservationController.getReservations);
router.post('/', reservationController.createReservation);
router.patch('/:id/status', reservationController.updateStatus);

export default router;
