import { Router } from 'express';
import * as portal from '../controllers/portal.controller';
import { authenticateCustomer } from '../middleware/customerAuth.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/auth/register', portal.register);
router.post('/auth/login', authLimiter, portal.login);
router.post('/auth/logout', portal.logout);
router.get('/auth/me', authenticateCustomer, portal.me);

router.get('/cars', portal.listCars);
router.get('/cars/:id', portal.getCar);
router.get('/cars/:id/availability', portal.availability);

router.post('/bookings', authenticateCustomer, portal.createBooking);
router.get('/bookings', authenticateCustomer, portal.myBookings);
router.get('/bookings/:id', authenticateCustomer, portal.myBookingDetail);
router.get('/bookings/:id/invoice.pdf', authenticateCustomer, portal.invoicePdf);
router.get('/bookings/:id/agreement.pdf', authenticateCustomer, portal.agreementPdf);

export default router;
