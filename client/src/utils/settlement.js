export function calculateSettlement(members) {
  let creditors = members
    .filter(m => m.balance > 0.01)
    .sort((a, b) => b.balance - a.balance);
  let debtors = members
    .filter(m => m.balance < -0.01)
    .sort((a, b) => a.balance - b.balance);

  const transactions = [];
  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const credit = creditors[i];
    const debt = debtors[j];
    const amount = Math.min(credit.balance, -debt.balance);

    transactions.push({
      from: { userId: debt.userId, name: debt.name },
      to: { userId: credit.userId, name: credit.name },
      amount: Math.round(amount * 100) / 100
    });

    credit.balance -= amount;
    debt.balance += amount;

    if (Math.abs(credit.balance) < 0.01) i++;
    if (Math.abs(debt.balance) < 0.01) j++;
  }

  return transactions;
}

export function calculateBalances(expenses, payments, members) {
  const balances = {};
  members.forEach(m => {
    balances[m.userId] = { userId: m.userId, name: m.name, balance: 0 };
  });

  expenses.forEach(expense => {
    balances[expense.paidById].balance += expense.amount;
    expense.splits.forEach(split => {
      balances[split.userId].balance -= split.amount;
    });
  });

  payments.forEach(payment => {
    balances[payment.senderId].balance += payment.amount;
    balances[payment.receiverId].balance -= payment.amount;
  });

  return Object.values(balances);
}
