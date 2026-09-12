import { getRoom, leaveRoom, getRoomSummary } from '../server-src/controllers/roomController.js';
import { authenticateToken } from '../server-src/middleware/auth.js';

export default async function handler(req, res) {
  try {
    await authenticateToken(req, res, async () => {
      const { id } = req.query;
      req.params = { id };

      if (req.method === 'GET') {
        if (req.url.includes('summary')) {
          await getRoomSummary(req, res);
        } else {
          await getRoom(req, res);
        }
      } else if (req.method === 'DELETE') {
        await leaveRoom(req, res);
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
    });
  } catch (error) {
    console.error('Room detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
