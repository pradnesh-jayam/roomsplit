import prisma from '../utils/db.js';

export async function getExpenses(req, res) {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

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

    const expenses = await prisma.expense.findMany({
      where: { roomId },
      include: {
        paidBy: {
          select: { id: true, name: true }
        },
        splits: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.expense.count({ where: { roomId } });

    res.json({ expenses, total, page, limit });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
}

export async function createExpense(req, res) {
  try {
    const { roomId } = req.params;
    const { title, amount, category, splits } = req.body;

    if (!title || !amount || !splits || splits.length === 0) {
      return res.status(400).json({ error: 'Title, amount, and splits are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
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

    const totalSplitAmount = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(totalSplitAmount - amount) > 0.01) {
      return res.status(400).json({ error: 'Split amounts must sum to total amount' });
    }

    const expense = await prisma.expense.create({
      data: {
        roomId,
        paidById: req.user.userId,
        title,
        amount,
        category: category || 'general',
        splits: {
          create: splits.map(s => ({
            userId: s.userId,
            amount: s.amount
          }))
        }
      },
      include: {
        paidBy: {
          select: { id: true, name: true }
        },
        splits: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
}

export async function deleteExpense(req, res) {
  try {
    const { roomId, expenseId } = req.params;

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        room: {
          include: {
            members: true
          }
        }
      }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expense.roomId !== roomId) {
      return res.status(400).json({ error: 'Expense does not belong to this room' });
    }

    const isMember = expense.room.members.some(m => m.userId === req.user.userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    const isAdmin = expense.room.members.find(m => m.userId === req.user.userId)?.role === 'admin';
    const isCreator = expense.paidById === req.user.userId;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Only admin or creator can delete expense' });
    }

    await prisma.expense.delete({ where: { id: expenseId } });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
}

export async function getExpenseCategories(req, res) {
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

    const expenses = await prisma.expense.findMany({
      where: { roomId },
      select: { category: true, amount: true }
    });

    const categories = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {});

    res.json(categories);
  } catch (error) {
    console.error('Get expense categories error:', error);
    res.status(500).json({ error: 'Failed to fetch expense categories' });
  }
}
