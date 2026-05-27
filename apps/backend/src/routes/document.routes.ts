import { Router } from 'express';
import * as documentController from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = Router();
router.use(authenticate);

router.get('/', documentController.getDocuments);
router.post('/', authorize('SUPER_ADMIN', 'STAFF'), documentController.createDocument);
router.delete('/:id', authorize('SUPER_ADMIN', 'STAFF'), documentController.deleteDocument);

export default router;
