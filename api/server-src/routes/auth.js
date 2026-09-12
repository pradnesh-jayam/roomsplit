import express from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateMe
} from '../controllers/authController.js';
import { authenticateToken, authenticateRefreshToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', authenticateRefreshToken, refresh);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateMe);

export default router;
