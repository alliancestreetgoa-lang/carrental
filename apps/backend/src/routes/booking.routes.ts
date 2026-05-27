import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = Router();
router.use(authenticate);

router.get('/', bookingController.getBookings);
router.get('/:id', bookingController.getBooking);
router.get('/:id/invoice', bookingController.getInvoice);
router.post('/', authorize('SUPER_ADMIN', 'STAFF'), bookingController.createBooking);
router.patch('/:id', authorize('SUPER_ADMIN', 'STAFF'), bookingController.updateBooking);
router.patch('/:id/status', authorize('SUPER_ADMIN', 'STAFF'), bookingController.updateStatus);
router.patch('/:id/complete', authorize('SUPER_ADMIN', 'STAFF'), bookingController.completeBooking);
router.patch('/:id/cancel', authorize('SUPER_ADMIN', 'STAFF'), bookingController.cancelBooking);
router.delete('/:id', authorize('SUPER_ADMIN'), bookingController.deleteBooking);

export default router;
