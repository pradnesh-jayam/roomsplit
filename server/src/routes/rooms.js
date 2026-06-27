import express from 'express';
import {
  createRoom,
  getRooms,
  getRoom,
  joinRoom,
  leaveRoom,
  getRoomSummary
} from '../controllers/roomController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createRoom);
router.get('/', getRooms);
router.get('/:id', getRoom);
router.post('/join', joinRoom);
router.delete('/:id/leave', leaveRoom);
router.get('/:id/summary', getRoomSummary);

export default router;
