import { getPayments, createPayment, getSettlement } from '../../../server/src/controllers/paymentController.js';
import { authenticateToken } from '../../../server/src/middleware/auth.js';

export default async function handler(req, res) {
  try {
    await authenticateToken(req, res, async () => {
      const { id } = req.query;
      req.params = { roomId: id };

      if (req.method === 'GET') {
        if (req.url.includes('settlement')) {
          await getSettlement(req, res);
        } else {
          await getPayments(req, res);
        }
      } else if (req.method === 'POST') {
        await createPayment(req, res);
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
    });
  } catch (error) {
    console.error('Payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
