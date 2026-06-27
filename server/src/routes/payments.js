import express from 'express';
import {
  getPayments,
  createPayment,
  getSettlement
} from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getPayments);
router.post('/', createPayment);
router.get('/settlement', getSettlement);

export default router;
