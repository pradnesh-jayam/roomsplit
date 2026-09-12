import { getMe, updateMe } from '../server-src/controllers/authController.js';
import { authenticateToken } from '../server-src/middleware/auth.js';

export default async function handler(req, res) {
  try {
    await authenticateToken(req, res, async () => {
      if (req.method === 'GET') {
        await getMe(req, res);
      } else if (req.method === 'PUT') {
        await updateMe(req, res);
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
