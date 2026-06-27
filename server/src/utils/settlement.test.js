import { describe, it, expect } from 'vitest';
import { calculateSettlement, calculateBalances } from './settlement.js';

describe('calculateSettlement', () => {
  it('returns empty array when all balances are zero', () => {
    const members = [
      { userId: '1', name: 'A', balance: 0 },
      { userId: '2', name: 'B', balance: 0 },
    ];
    expect(calculateSettlement(members)).toHaveLength(0);
  });

  it('returns one transaction for simple two-person debt', () => {
    const members = [
      { userId: '1', name: 'A', balance: 100 },
      { userId: '2', name: 'B', balance: -100 },
    ];
    const result = calculateSettlement(members);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(100);
    expect(result[0].from.userId).toBe('2');
    expect(result[0].to.userId).toBe('1');
  });

  it('minimises transactions for 3 people', () => {
    const members = [
      { userId: '1', name: 'A', balance: 200 },
      { userId: '2', name: 'B', balance: -50 },
      { userId: '3', name: 'C', balance: -150 },
    ];
    const result = calculateSettlement(members);
    expect(result.length).toBeLessThanOrEqual(2);
    const totalPaid = result.reduce((sum, t) => sum + t.amount, 0);
    expect(totalPaid).toBe(200);
  });

  it('handles floating point amounts correctly', () => {
    const members = [
      { userId: '1', name: 'A', balance: 33.33 },
      { userId: '2', name: 'B', balance: -33.33 },
    ];
    const result = calculateSettlement(members);
    expect(result[0].amount).toBe(33.33);
  });
});

describe('calculateBalances', () => {
  it('correctly calculates net balance after an expense', () => {
    const members = [{ userId: '1', name: 'A' }, { userId: '2', name: 'B' }];
    const expenses = [{
      paidById: '1',
      amount: 100,
      splits: [{ userId: '1', amount: 50 }, { userId: '2', amount: 50 }]
    }];
    const balances = calculateBalances(expenses, [], members);
    expect(balances.find(b => b.userId === '1').balance).toBe(50);
    expect(balances.find(b => b.userId === '2').balance).toBe(-50);
  });

  it('accounts for recorded payments in balance calculation', () => {
    const members = [{ userId: '1', name: 'A' }, { userId: '2', name: 'B' }];
    const expenses = [{
      paidById: '1', amount: 100,
      splits: [{ userId: '1', amount: 50 }, { userId: '2', amount: 50 }]
    }];
    const payments = [{ senderId: '2', receiverId: '1', amount: 50 }];
    const balances = calculateBalances(expenses, payments, members);
    expect(balances.find(b => b.userId === '1').balance).toBe(0);
    expect(balances.find(b => b.userId === '2').balance).toBe(0);
  });
});
