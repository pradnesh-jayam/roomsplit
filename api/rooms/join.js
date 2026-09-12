import { joinRoom } from '../server-src/controllers/roomController.js';
import { authenticateToken } from '../server-src/middleware/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await authenticateToken(req, res, () => joinRoom(req, res));
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
