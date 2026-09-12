import { deleteExpense } from '../../../server-src/controllers/expenseController.js';
import { authenticateToken } from '../../../server-src/middleware/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await authenticateToken(req, res, async () => {
      const { id, expenseId } = req.query;
      req.params = { roomId: id, expenseId };
      await deleteExpense(req, res);
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
