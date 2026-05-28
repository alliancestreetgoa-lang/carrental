import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = Router();
router.use(authenticate, authorize('SUPER_ADMIN'));

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
