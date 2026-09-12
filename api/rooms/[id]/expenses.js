import { getExpenses, createExpense, getExpenseCategories } from '../../../server/src/controllers/expenseController.js';
import { authenticateToken } from '../../../server/src/middleware/auth.js';

export default async function handler(req, res) {
  try {
    await authenticateToken(req, res, async () => {
      const { id } = req.query;
      req.params = { roomId: id };

      if (req.method === 'GET') {
        if (req.url.includes('categories')) {
          await getExpenseCategories(req, res);
        } else {
          await getExpenses(req, res);
        }
      } else if (req.method === 'POST') {
        await createExpense(req, res);
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
    });
  } catch (error) {
    console.error('Expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
