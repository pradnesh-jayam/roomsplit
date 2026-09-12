import { refresh } from '../../server/src/controllers/authController.js';
import { authenticateRefreshToken } from '../../server/src/middleware/auth.js';
import { cookie } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse cookies from headers
    const cookies = cookie.parse(req.headers.cookie || '');
    req.cookies = cookies;

    await authenticateRefreshToken(req, res, () => refresh(req, res));
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
