
export function calculateNetSettlements(balances: Record<string, number>) {
  const settlements = [];
  const creditors = [];
  const debtors = [];
  for (const [userId, balance] of Object.entries(balances)) {
    if (balance > 0.01) creditors.push({ userId, amount: balance });
    else if (balance < -0.01) debtors.push({ userId, amount: -balance });
  }
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  // Debug log (always log for now)
  console.log('NetSettlements calculation:');
  console.log('Balances:', balances);
  console.log('Creditors:', creditors);
  console.log('Debtors:', debtors);
  while (creditors.length && debtors.length) {
    const creditor = creditors[0];
    const debtor = debtors[0];
    const amount = Math.min(creditor.amount, debtor.amount);
    settlements.push({ fromUserId: debtor.userId, toUserId: creditor.userId, amount: Math.round(amount * 100) / 100 });
    creditor.amount -= amount;
    debtor.amount -= amount;
    if (creditor.amount < 0.01) creditors.shift();
    if (debtor.amount < 0.01) debtors.shift();
  }
  console.log('Settlements:', settlements);
  return settlements;
}