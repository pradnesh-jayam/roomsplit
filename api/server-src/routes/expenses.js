import express from 'express';
import {
  getExpenses,
  createExpense,
  deleteExpense,
  getExpenseCategories
} from '../controllers/expenseController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.use(authenticateToken);

router.get('/', getExpenses);
router.post('/', createExpense);
router.delete('/:expenseId', deleteExpense);
router.get('/categories', getExpenseCategories);

export default router;
