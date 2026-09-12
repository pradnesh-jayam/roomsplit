import { register, login, refresh, logout, getMe, updateMe } from './server-src/controllers/authController.js';
import { createRoom, getRooms, getRoom, leaveRoom, getRoomSummary, joinRoom } from './server-src/controllers/roomController.js';
import { getExpenses, createExpense, getExpenseCategories, deleteExpense } from './server-src/controllers/expenseController.js';
import { getPayments, createPayment, getSettlement } from './server-src/controllers/paymentController.js';
import { authenticateToken, authenticateRefreshToken } from './server-src/middleware/auth.js';
import { cookie } from 'cookie';

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Parse cookies for refresh token
  const cookies = cookie.parse(req.headers.cookie || '');
  req.cookies = cookies;

  try {
    // Auth routes
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      await register(req, res);
    }
    else if (pathname === '/api/auth/login' && req.method === 'POST') {
      await login(req, res);
    }
    else if (pathname === '/api/auth/refresh' && req.method === 'POST') {
      await authenticateRefreshToken(req, res, () => refresh(req, res));
    }
    else if (pathname === '/api/auth/logout' && req.method === 'POST') {
      await logout(req, res);
    }
    else if (pathname === '/api/auth/me') {
      await authenticateToken(req, res, async () => {
        if (req.method === 'GET') await getMe(req, res);
        else if (req.method === 'PUT') await updateMe(req, res);
        else res.status(405).json({ error: 'Method not allowed' });
      });
    }
    // Room routes
    else if (pathname === '/api/rooms') {
      await authenticateToken(req, res, async () => {
        if (req.method === 'POST') await createRoom(req, res);
        else if (req.method === 'GET') await getRooms(req, res);
        else res.status(405).json({ error: 'Method not allowed' });
      });
    }
    else if (pathname === '/api/rooms/join' && req.method === 'POST') {
      await authenticateToken(req, res, () => joinRoom(req, res));
    }
    else if (pathname.startsWith('/api/rooms/') && pathname.endsWith('/expenses') && !pathname.includes('/expenses/')) {
      await authenticateToken(req, res, async () => {
        const roomId = pathname.split('/')[3];
        req.params = { roomId };
        if (req.method === 'GET') {
          if (url.searchParams.has('categories')) await getExpenseCategories(req, res);
          else await getExpenses(req, res);
        }
        else if (req.method === 'POST') await createExpense(req, res);
        else res.status(405).json({ error: 'Method not allowed' });
      });
    }
    else if (pathname.includes('/expenses/') && pathname.match(/\/api\/rooms\/[^/]+\/expenses\/[^/]+$/)) {
      await authenticateToken(req, res, async () => {
        const parts = pathname.split('/');
        const roomId = parts[3];
        const expenseId = parts[5];
        req.params = { roomId, expenseId };
        if (req.method === 'DELETE') await deleteExpense(req, res);
        else res.status(405).json({ error: 'Method not allowed' });
      });
    }
    else if (pathname.startsWith('/api/rooms/') && pathname.endsWith('/payments')) {
      await authenticateToken(req, res, async () => {
        const roomId = pathname.split('/')[3];
        req.params = { roomId };
        if (req.method === 'GET') {
          if (url.searchParams.has('settlement')) await getSettlement(req, res);
          else await getPayments(req, res);
        }
        else if (req.method === 'POST') await createPayment(req, res);
        else res.status(405).json({ error: 'Method not allowed' });
      });
    }
    else if (pathname.match(/^\/api\/rooms\/[^/]+$/)) {
      await authenticateToken(req, res, async () => {
        const id = pathname.split('/')[3];
        req.params = { id };
        if (req.method === 'GET') {
          if (url.searchParams.has('summary')) await getRoomSummary(req, res);
          else await getRoom(req, res);
        }
        else if (req.method === 'DELETE') await leaveRoom(req, res);
        else res.status(405).json({ error: 'Method not allowed' });
      });
    }
    else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
