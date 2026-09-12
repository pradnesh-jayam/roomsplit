import { createRoom, getRooms } from '../../server/src/controllers/roomController.js';
import { authenticateToken } from '../../server/src/middleware/auth.js';

export default async function handler(req, res) {
  try {
    await authenticateToken(req, res, async () => {
      if (req.method === 'POST') {
        await createRoom(req, res);
      } else if (req.method === 'GET') {
        await getRooms(req, res);
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
    });
  } catch (error) {
    console.error('Rooms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
