import { Router } from 'express';
import * as expenseController from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = Router();
router.use(authenticate);

router.get('/', expenseController.getExpenses);
router.post('/', authorize('SUPER_ADMIN', 'ACCOUNTANT'), expenseController.createExpense);
router.patch('/:id', authorize('SUPER_ADMIN', 'ACCOUNTANT'), expenseController.updateExpense);
router.delete('/:id', authorize('SUPER_ADMIN', 'ACCOUNTANT'), expenseController.deleteExpense);

export default router;
