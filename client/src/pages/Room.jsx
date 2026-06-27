import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoom, getExpenses, getRoomSummary, getPayments, getSettlement, leaveRoom, createExpense, createPayment } from '../api/rooms.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatCurrency, formatDate, getCategoryEmoji } from '../utils/format.js';
import { isDemoMode } from '../utils/demo.js';
import { generateUPILink } from '../utils/upi.js';
import { calculateBalances, calculateSettlement } from '../utils/settlement.js';
import DemoBanner from '../components/DemoBanner.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';

export default function Room() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const showToast = useToast();

  const [activeTab, setActiveTab] = useState('expenses');
  const [room, setRoom] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlement, setSettlement] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('general');
  const [splitType, setSplitType] = useState('equal');
  const [customSplits, setCustomSplits] = useState({});
  const [submittingExpense, setSubmittingExpense] = useState(false);

  useEffect(() => {
    loadRoomData();
  }, [id]);

  async function loadRoomData() {
    setLoading(true);
    try {
      const [roomData, expensesData, paymentsData] = await Promise.all([
        getRoom(id),
        getExpenses(id),
        getPayments(id)
      ]);
      setRoom(roomData);
      setExpenses(expensesData.expenses || expensesData);
      setPayments(paymentsData);

      const summary = await getRoomSummary(id);
      setBalances(summary.balances);
      setSettlement(summary.settlement);
    } catch (error) {
      showToast(error.message, 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExpense(e) {
    e.preventDefault();
    
    if (!expenseTitle || !expenseAmount) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (parseFloat(expenseAmount) <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }

    const amount = parseFloat(expenseAmount);
    let splits = [];

    if (splitType === 'equal') {
      const share = amount / room.members.length;
      splits = room.members.map(m => ({
        userId: m.userId,
        amount: Math.round(share * 100) / 100
      }));
    } else {
      const totalCustom = Object.values(customSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      if (Math.abs(totalCustom - amount) > 0.01) {
        showToast(`Split amounts must sum to ${formatCurrency(amount)}`, 'error');
        return;
      }
      splits = room.members.map(m => ({
        userId: m.userId,
        amount: parseFloat(customSplits[m.userId]) || 0
      }));
    }

    if (isDemoMode()) {
      showToast('Demo mode — changes aren\'t saved', 'info');
      setShowAddExpense(false);
      setExpenseTitle('');
      setExpenseAmount('');
      setCustomSplits({});
      return;
    }

    setSubmittingExpense(true);
    try {
      await createExpense(id, { title: expenseTitle, amount, category: expenseCategory, splits });
      await loadRoomData();
      setShowAddExpense(false);
      setExpenseTitle('');
      setExpenseAmount('');
      setCustomSplits({});
      showToast('Expense added successfully', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmittingExpense(false);
    }
  }

  async function handleLeaveRoom() {
    if (!confirm('Are you sure you want to leave this room?')) return;

    try {
      await leaveRoom(id);
      navigate('/dashboard');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function handleRecordPayment(toUserId, amount) {
    if (isDemoMode()) {
      showToast('Demo mode — changes aren\'t saved', 'info');
      return;
    }

    try {
      await createPayment(id, { receiverId: toUserId, amount, note: 'Settlement payment' });
      await loadRoomData();
      showToast('Payment recorded successfully', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!room) return null;

  const myBalance = balances.find(b => b.userId === user?.id)?.balance || 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <DemoBanner />
      
      <nav className="px-4 py-4 border-b border-card">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-text-muted hover:text-text-primary">
            ← Back
          </button>
          <h1 className="text-lg font-bold">{room.name}</h1>
          <button onClick={handleLeaveRoom} className="text-negative text-sm">
            Leave
          </button>
        </div>
      </nav>

      <div className="border-b border-card">
        <div className="max-w-4xl mx-auto flex">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 px-4 py-3 text-center font-medium ${
              activeTab === 'expenses' ? 'text-primary border-b-2 border-primary' : 'text-text-muted'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className={`flex-1 px-4 py-3 text-center font-medium ${
              activeTab === 'balances' ? 'text-primary border-b-2 border-primary' : 'text-text-muted'
            }`}
          >
            Balances
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 px-4 py-3 text-center font-medium ${
              activeTab === 'activity' ? 'text-primary border-b-2 border-primary' : 'text-text-muted'
            }`}
          >
            Activity
          </button>
        </div>
      </div>

      <main className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div key={expense.id} className="p-4 bg-card rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{getCategoryEmoji(expense.category)}</span>
                        <h3 className="font-semibold">{expense.title}</h3>
                      </div>
                      <p className="text-text-muted text-sm">
                        {expense.paidBy?.name || 'Unknown'} paid {formatCurrency(expense.amount)}
                      </p>
                      <p className="text-text-muted text-xs mt-1">{formatDate(expense.date || expense.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(expense.amount)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && (
                <p className="text-center text-text-muted py-8">No expenses yet</p>
              )}
            </div>
          )}

          {activeTab === 'balances' && (
            <div className="space-y-6">
              <div className="p-4 bg-card rounded-lg">
                <h3 className="font-semibold mb-4">Your Balance</h3>
                <p className={`text-3xl font-bold ${myBalance >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {myBalance >= 0 ? '+' : ''}{formatCurrency(myBalance)}
                </p>
                <p className="text-text-muted text-sm mt-1">
                  {myBalance > 0 ? 'You are owed' : myBalance < 0 ? 'You owe' : 'All settled up'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-4">All Balances</h3>
                <div className="space-y-2">
                  {balances.map((balance) => (
                    <div key={balance.userId} className="flex items-center justify-between p-3 bg-card rounded-lg">
                      <span>{balance.name}</span>
                      <span className={`font-semibold ${balance.balance >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {balance.balance >= 0 ? '+' : ''}{formatCurrency(balance.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {settlement.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">Settle Up</h3>
                  <div className="space-y-3">
                    {settlement.map((tx, index) => {
                      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                      const upiLink = generateUPILink({
                        upiId: tx.to.upiId,
                        name: tx.to.name,
                        amount: tx.amount,
                        note: `RoomSplit settlement from ${tx.from.name}`
                      });

                      return (
                        <div key={index} className="p-4 bg-card rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-semibold">{tx.from.name}</p>
                              <p className="text-text-muted text-sm">pays {tx.to.name}</p>
                            </div>
                            <p className="font-bold text-lg">{formatCurrency(tx.amount)}</p>
                          </div>
                          {tx.from.userId === user?.id ? (
                            isMobile && upiLink ? (
                              <a
                                href={upiLink}
                                className="block w-full text-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                              >
                                Pay ₹{tx.amount} via UPI
                              </a>
                            ) : (
                              <p className="text-text-muted text-sm text-center">
                                Open on mobile to pay via UPI
                              </p>
                            )
                          ) : (
                            <button
                              onClick={() => handleRecordPayment(tx.to.userId, tx.amount)}
                              className="w-full px-4 py-2 bg-card text-text-primary rounded-lg hover:bg-card/80 border border-card"
                            >
                              Mark as Paid
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {[...expenses, ...payments]
                .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
                .map((item) => {
                  if (item.senderId) {
                    return (
                      <div key={item.id} className="p-4 bg-card rounded-lg">
                        <p className="font-semibold">{item.sender?.name || 'Someone'} paid {item.receiver?.name || 'someone'} {formatCurrency(item.amount)}</p>
                        {item.note && <p className="text-text-muted text-sm">{item.note}</p>}
                        <p className="text-text-muted text-xs mt-1">{formatDate(item.createdAt)}</p>
                      </div>
                    );
                  }
                  return (
                    <div key={item.id} className="p-4 bg-card rounded-lg">
                      <p className="font-semibold">{item.paidBy?.name || 'Someone'} added {item.title} {formatCurrency(item.amount)}</p>
                      <p className="text-text-muted text-xs mt-1">{formatDate(item.date || item.createdAt)}</p>
                    </div>
                  );
                })}
              {[...expenses, ...payments].length === 0 && (
                <p className="text-center text-text-muted py-8">No activity yet</p>
              )}
            </div>
          )}
        </div>
      </main>

      {activeTab === 'expenses' && (
        <button
          onClick={() => setShowAddExpense(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-primary/90 transition-colors"
        >
          +
        </button>
      )}

      {showAddExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="w-full max-w-md bg-surface rounded-t-lg sm:rounded-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Add Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Title</label>
                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-card rounded-lg text-text-primary focus:outline-none focus:border-primary"
                  placeholder="What was it for?"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-card rounded-lg text-text-primary focus:outline-none focus:border-primary"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-card rounded-lg text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="general">📦 General</option>
                  <option value="food">🍕 Food</option>
                  <option value="utilities">💡 Utilities</option>
                  <option value="household">🏠 Household</option>
                  <option value="transport">🚗 Transport</option>
                  <option value="entertainment">🎮 Entertainment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-2">Split Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="equal"
                      checked={splitType === 'equal'}
                      onChange={() => setSplitType('equal')}
                      className="accent-primary"
                    />
                    <span>Equal</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="custom"
                      checked={splitType === 'custom'}
                      onChange={() => setSplitType('custom')}
                      className="accent-primary"
                    />
                    <span>Custom</span>
                  </label>
                </div>
              </div>
              {splitType === 'custom' && (
                <div className="space-y-2">
                  {room.members.map((member) => (
                    <div key={member.userId} className="flex items-center gap-2">
                      <span className="w-24 text-sm text-text-muted">{member.name}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={customSplits[member.userId] || ''}
                        onChange={(e) => setCustomSplits({ ...customSplits, [member.userId]: e.target.value })}
                        className="flex-1 px-3 py-2 bg-card border border-card rounded-lg text-text-primary focus:outline-none focus:border-primary"
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-4 py-2 bg-card text-text-primary rounded-lg hover:bg-card/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {submittingExpense ? 'Adding...\u2026' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
