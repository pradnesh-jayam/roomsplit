import prisma from '../utils/db.js';
import { calculateBalances, calculateSettlement } from '../utils/settlement.js';

export async function createRoom(req, res) {
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

export async function getRooms(req, res) {
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

export async function getRoom(req, res) {
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

export async function joinRoom(req, res) {
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

export async function leaveRoom(req, res) {
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

export async function getRoomSummary(req, res) {
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
