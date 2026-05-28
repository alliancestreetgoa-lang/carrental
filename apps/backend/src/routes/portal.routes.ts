import { Router } from 'express';
import * as portal from '../controllers/portal.controller';
import { authenticateCustomer } from '../middleware/customerAuth.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/auth/register', authLimiter, portal.register);
router.post('/auth/login', authLimiter, portal.login);
router.post('/auth/logout', portal.logout);
router.get('/auth/me', authenticateCustomer, portal.me);
router.patch('/auth/me', authenticateCustomer, portal.updateProfile);
router.post('/auth/verify-email', authLimiter, portal.verifyEmail);
router.post('/auth/resend-verification', authLimiter, authenticateCustomer, portal.resendVerification);
router.post('/auth/forgot-password', authLimiter, portal.forgotPassword);
router.post('/auth/reset-password', authLimiter, portal.resetPassword);
router.post('/auth/send-mobile-otp', authLimiter, authenticateCustomer, portal.sendMobileOtp);
router.post('/auth/verify-mobile-otp', authLimiter, authenticateCustomer, portal.verifyMobileOtp);

router.get('/car-brands', portal.listBrands);
router.get('/cars', portal.listCars);
router.get('/cars/:id/related', portal.relatedCars);
router.get('/cars/:id', portal.getCar);
router.get('/cars/:id/availability', portal.availability);
router.get('/cars/:id/reviews', portal.carReviews);

router.post('/bookings', authenticateCustomer, portal.createBooking);
router.get('/bookings', authenticateCustomer, portal.myBookings);
router.get('/bookings/:id', authenticateCustomer, portal.myBookingDetail);
router.get('/bookings/:id/invoice.pdf', authenticateCustomer, portal.invoicePdf);
router.get('/bookings/:id/agreement.pdf', authenticateCustomer, portal.agreementPdf);
router.post('/bookings/:id/cancel', authenticateCustomer, portal.cancelMyBooking);
router.patch('/bookings/:id/extend', authenticateCustomer, portal.extendMyBooking);
router.get('/payments', authenticateCustomer, portal.myPayments);
router.post('/bookings/:id/pay', authenticateCustomer, portal.payBooking);
router.post('/payments/webhook', portal.paymentsWebhook); // public (gateway callback); mock no-op

router.get('/testimonials', portal.testimonials);
router.post('/reviews', authenticateCustomer, portal.createReview);

router.post('/uploads/image', authenticateCustomer, portal.portalUploadMiddleware, portal.portalUploadImage);
router.get('/documents', authenticateCustomer, portal.myDocuments);
router.post('/documents', authenticateCustomer, portal.createDocument);
router.delete('/documents/:id', authenticateCustomer, portal.deleteDocument);

export default router;
