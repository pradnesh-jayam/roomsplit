import { apiRequest } from './client.js';
import { isDemoMode, DEMO_ROOM, DEMO_EXPENSES, DEMO_PAYMENTS } from '../utils/demo.js';

export async function createRoom(name) {
  if (isDemoMode()) {
    return DEMO_ROOM;
  }
  return apiRequest('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({ name })
  });
}

export async function getRooms() {
  if (isDemoMode()) {
    return [DEMO_ROOM];
  }
  return apiRequest('/api/rooms');
}

export async function getRoom(id) {
  if (isDemoMode()) {
    return DEMO_ROOM;
  }
  return apiRequest(`/api/rooms/${id}`);
}

export async function joinRoom(inviteCode) {
  if (isDemoMode()) {
    return DEMO_ROOM;
  }
  return apiRequest('/api/rooms/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode })
  });
}

export async function leaveRoom(id) {
  if (isDemoMode()) {
    return { message: 'Left room successfully' };
  }
  return apiRequest(`/api/rooms/${id}/leave`, { method: 'DELETE' });
}

export async function getRoomSummary(id) {
  if (isDemoMode()) {
    const { calculateBalances, calculateSettlement } = await import('../utils/settlement.js');
    const members = DEMO_ROOM.members;
    const balances = calculateBalances(DEMO_EXPENSES, DEMO_PAYMENTS, members);
    const settlement = calculateSettlement(balances.map(b => ({ ...b })));
    return { balances, settlement };
  }
  return apiRequest(`/api/rooms/${id}/summary`);
}

export async function getExpenses(roomId) {
  if (isDemoMode()) {
    return { expenses: DEMO_EXPENSES, total: DEMO_EXPENSES.length, page: 1, limit: 20 };
  }
  return apiRequest(`/api/rooms/${roomId}/expenses`);
}

export async function createExpense(roomId, expense) {
  if (isDemoMode()) {
    return { ...expense, id: `demo_${Date.now()}`, createdAt: new Date().toISOString() };
  }
  return apiRequest(`/api/rooms/${roomId}/expenses`, {
    method: 'POST',
    body: JSON.stringify(expense)
  });
}

export async function deleteExpense(roomId, expenseId) {
  if (isDemoMode()) {
    return { message: 'Expense deleted successfully' };
  }
  return apiRequest(`/api/rooms/${roomId}/expenses/${expenseId}`, { method: 'DELETE' });
}

export async function getPayments(roomId) {
  if (isDemoMode()) {
    return DEMO_PAYMENTS;
  }
  return apiRequest(`/api/rooms/${roomId}/payments`);
}

export async function createPayment(roomId, payment) {
  if (isDemoMode()) {
    return { ...payment, id: `demo_${Date.now()}`, createdAt: new Date().toISOString() };
  }
  return apiRequest(`/api/rooms/${roomId}/payments`, {
    method: 'POST',
    body: JSON.stringify(payment)
  });
}

export async function getSettlement(roomId) {
  if (isDemoMode()) {
    const { calculateBalances, calculateSettlement } = await import('../utils/settlement.js');
    const members = DEMO_ROOM.members;
    const balances = calculateBalances(DEMO_EXPENSES, DEMO_PAYMENTS, members);
    const settlement = calculateSettlement(balances.map(b => ({ ...b })));
    return settlement.map(t => ({
      from: { ...t.from, upiId: members.find(m => m.userId === t.from.userId)?.upiId },
      to: { ...t.to, upiId: members.find(m => m.userId === t.to.userId)?.upiId },
      amount: t.amount
    }));
  }
  return apiRequest(`/api/rooms/${roomId}/payments/settlement`);
}
