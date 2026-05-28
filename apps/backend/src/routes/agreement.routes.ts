import { Router } from 'express';
import * as agreementController from '../controllers/agreement.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = Router();
router.use(authenticate);

router.get('/', agreementController.getAgreements);
router.get('/:id', agreementController.getAgreement);
router.get('/:id/pdf', agreementController.getAgreementPdf);
router.post('/', authorize('SUPER_ADMIN', 'STAFF'), agreementController.createAgreement);
router.patch('/:id/sign', authorize('SUPER_ADMIN', 'STAFF'), agreementController.signAgreement);
router.patch('/:id', authorize('SUPER_ADMIN', 'STAFF'), agreementController.updateAgreement);
router.delete('/:id', authorize('SUPER_ADMIN'), agreementController.deleteAgreement);

export default router;
