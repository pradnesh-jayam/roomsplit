import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { cookie } from 'cookie';

const prisma = new PrismaClient();

// Settlement algorithms
function calculateBalances(expenses, payments, members) {
  const balances = {};
  members.forEach(m => {
    balances[m.userId] = { userId: m.userId, name: m.name, upiId: m.upiId, balance: 0 };
  });

  expenses.forEach(expense => {
    const paidBy = balances[expense.paidById];
    if (paidBy) paidBy.balance += expense.amount;

    expense.splits.forEach(split => {
      const user = balances[split.userId];
      if (user) user.balance -= split.amount;
    });
  });

  payments.forEach(payment => {
    const sender = balances[payment.senderId];
    const receiver = balances[payment.receiverId];
    if (sender) sender.balance -= payment.amount;
    if (receiver) receiver.balance += payment.amount;
  });

  return Object.values(balances);
}

function calculateSettlement(balances) {
  const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
  const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
  const settlements = [];

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(-debtor.balance, creditor.balance);

    if (amount > 0.01) {
      settlements.push({ from: debtor, to: creditor, amount });
      debtor.balance += amount;
      creditor.balance -= amount;
    }

    if (Math.abs(debtor.balance) < 0.01) i++;
    if (Math.abs(creditor.balance) < 0.01) j++;
  }

  return settlements;
}

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

function authenticateRefreshToken(req, res, next) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid refresh token' });
  }
}

// Controllers
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, upiId: true, createdAt: true }
    });

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({ user, accessToken });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, accessToken });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
}

async function refresh(req, res) {
  try {
    const accessToken = jwt.sign(
      { userId: req.user.userId, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
}

async function logout(req, res) {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
}

async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, upiId: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

async function updateMe(req, res) {
  try {
    const { name, upiId } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name, upiId },
      select: { id: true, name: true, email: true, upiId: true, createdAt: true }
    });

    res.json(user);
  } catch (error) {
    console.error('Update me error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

async function createRoom(req, res) {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const room = await prisma.room.create({
      data: {
        name,
        members: {
          create: {
            userId: req.user.userId,
            role: 'admin'
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, upiId: true }
            }
          }
        }
      }
    });

    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
}

async function getRooms(req, res) {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        members: {
          some: {
            userId: req.user.userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, upiId: true }
            }
          }
        },
        _count: {
          select: { members: true, expenses: true }
        }
      }
    });

    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
}

async function getRoom(req, res) {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, upiId: true }
            }
          }
        }
      }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const isMember = room.members.some(m => m.userId === req.user.userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
}

async function joinRoom(req, res) {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const room = await prisma.room.findUnique({
      where: { inviteCode },
      include: {
        members: true
      }
    });

    if (!room) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const isAlreadyMember = room.members.some(m => m.userId === req.user.userId);
    if (isAlreadyMember) {
      return res.status(400).json({ error: 'Already a member of this room' });
    }

    await prisma.roomMember.create({
      data: {
        userId: req.user.userId,
        roomId: room.id,
        role: 'member'
      }
    });

    const updatedRoom = await prisma.room.findUnique({
      where: { id: room.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, upiId: true }
            }
          }
        }
      }
    });

    res.json(updatedRoom);
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
}

async function leaveRoom(req, res) {
  try {
    const { id } = req.params;

    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: req.user.userId,
          roomId: id
        }
      },
      include: {
        room: {
          include: {
            members: true
          }
        }
      }
    });

    if (!membership) {
      return res.status(404).json({ error: 'Not a member of this room' });
    }

    if (membership.role === 'admin' && membership.room.members.length > 1) {
      return res.status(400).json({ error: 'Admin cannot leave room with other members. Transfer admin role first.' });
    }

    await prisma.roomMember.delete({
      where: {
        userId_roomId: {
          userId: req.user.userId,
          roomId: id
        }
      }
    });

    if (membership.room.members.length === 1) {
      await prisma.room.delete({ where: { id } });
    }

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
}

async function getRoomSummary(req, res) {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, upiId: true }
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

    res.json({ balances, settlement });
  } catch (error) {
    console.error('Get room summary error:', error);
    res.status(500).json({ error: 'Failed to fetch room summary' });
  }
}

async function getExpenses(req, res) {
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

async function createExpense(req, res) {
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

async function deleteExpense(req, res) {
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

async function getExpenseCategories(req, res) {
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

async function getPayments(req, res) {
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

async function createPayment(req, res) {
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

async function getSettlement(req, res) {
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

// Main handler
export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Parse cookies
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
