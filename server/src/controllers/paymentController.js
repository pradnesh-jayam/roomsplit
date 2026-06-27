import prisma from '../utils/db.js';
import { calculateBalances, calculateSettlement } from '../utils/settlement.js';

export async function getPayments(req, res) {
  try {
    const { roomId } = req.params;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: true
      }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const isMember = room.members.some(m => m.userId === req.user.userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    const payments = await prisma.payment.findMany({
      where: { roomId },
      include: {
        sender: {
          select: { id: true, name: true }
        },
        receiver: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
}

export async function createPayment(req, res) {
  try {
    const { roomId } = req.params;
    const { receiverId, amount, note } = req.body;

    if (!receiverId || !amount) {
      return res.status(400).json({ error: 'Receiver and amount are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (receiverId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot pay yourself' });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: true
      }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const isMember = room.members.some(m => m.userId === req.user.userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    const isReceiverMember = room.members.some(m => m.userId === receiverId);
    if (!isReceiverMember) {
      return res.status(400).json({ error: 'Receiver is not a member of this room' });
    }

    const payment = await prisma.payment.create({
      data: {
        roomId,
        senderId: req.user.userId,
        receiverId,
        amount,
        note
      },
      include: {
        sender: {
          select: { id: true, name: true }
        },
        receiver: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
}

export async function getSettlement(req, res) {
  try {
    const { roomId } = req.params;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, upiId: true }
            }
          }
        },
        expenses: {
          include: {
            splits: true
          }
        },
        payments: true
      }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const isMember = room.members.some(m => m.userId === req.user.userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    const members = room.members.map(m => ({
      userId: m.user.id,
      name: m.user.name,
      upiId: m.user.upiId
    }));

    const expenses = room.expenses.map(e => ({
      paidById: e.paidById,
      amount: e.amount,
      splits: e.splits.map(s => ({ userId: s.userId, amount: s.amount }))
    }));

    const payments = room.payments.map(p => ({
      senderId: p.senderId,
      receiverId: p.receiverId,
      amount: p.amount
    }));

    const balances = calculateBalances(expenses, payments, members);
    const settlement = calculateSettlement(
      balances.map(b => ({ ...b }))
    );

    const settlementWithUPI = settlement.map(t => ({
      from: {
        userId: t.from.userId,
        name: t.from.name,
        upiId: members.find(m => m.userId === t.from.userId)?.upiId
      },
      to: {
        userId: t.to.userId,
        name: t.to.name,
        upiId: members.find(m => m.userId === t.to.userId)?.upiId
      },
      amount: t.amount
    }));

    res.json(settlementWithUPI);
  } catch (error) {
    console.error('Get settlement error:', error);
    res.status(500).json({ error: 'Failed to fetch settlement' });
  }
}
