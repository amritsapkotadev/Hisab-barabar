// utils/expenseSplitter.ts

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';

export interface Payer {
  userId: string;
  amount: number;
}

export interface ExpenseInput {
  totalAmount: number;
  paidBy: Payer[];
  splitType: SplitType;
  splitDetails: Record<string, number>; // userId -> amount | percent | shares
  participants: string[]; // userIds who are splitting the expense
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface SplitResult {
  balances: Record<string, number>; // userId -> net balance (+ = owed to them, - = they owe)
  settlements: Settlement[];
  isValid: boolean;
  errors: string[];
}

// Small value for floating point comparison
const EPSILON = 0.01;

// Round to 2 decimal places
const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Calculate expense splits and determine who owes whom
 * 
 * Algorithm:
 * 1. Validate inputs (total paid = total amount, splits sum correctly)
 * 2. Calculate how much each participant owes based on split type
 * 3. Calculate net balance: what each person paid - what they owe
 * 4. Simplify debts using greedy algorithm (minimize transactions)
 */
export function calculateExpenseSplits(expense: ExpenseInput): SplitResult {
  const errors: string[] = [];
  const { totalAmount, paidBy, splitType, splitDetails, participants } = expense;

  /* ==================== VALIDATION ==================== */

  // Check we have participants
  if (!participants || participants.length === 0) {
    errors.push('No participants selected');
  }

  // Validate total paid equals total amount
  const totalPaid = round2(paidBy.reduce((sum, p) => sum + p.amount, 0));
  if (Math.abs(totalPaid - totalAmount) > EPSILON) {
    errors.push(`Total paid ($${totalPaid}) does not match expense amount ($${totalAmount})`);
  }

  // Validate payer amounts are positive
  paidBy.forEach(p => {
    if (p.amount < 0) {
      errors.push(`Payer ${p.userId} cannot have negative amount`);
    }
  });

  // Validate split details exist for non-equal splits
  if (splitType !== 'equal') {
    participants.forEach(uid => {
      if (!(uid in splitDetails)) {
        errors.push(`Missing split value for participant ${uid}`);
      }
    });
  }

  // Validate based on split type
  if (splitType === 'percentage') {
    const totalPct = round2(Object.values(splitDetails).reduce((a, b) => a + b, 0));
    if (Math.abs(totalPct - 100) > EPSILON) {
      errors.push(`Total percentage (${totalPct}%) must equal 100%`);
    }
  }

  if (splitType === 'exact') {
    const totalSplit = round2(Object.values(splitDetails).reduce((a, b) => a + b, 0));
    if (Math.abs(totalSplit - totalAmount) > EPSILON) {
      errors.push(`Exact split total ($${totalSplit}) does not match expense ($${totalAmount})`);
    }
  }

  if (splitType === 'shares') {
    const totalShares = Object.values(splitDetails).reduce((a, b) => a + b, 0);
    if (totalShares <= 0) {
      errors.push('Total shares must be greater than zero');
    }
  }

  // Return early if validation fails
  if (errors.length > 0) {
    return { balances: {}, settlements: [], isValid: false, errors };
  }

  /* ==================== CALCULATE WHAT EACH PERSON OWES ==================== */

  const owed: Record<string, number> = {};

  if (splitType === 'equal') {
    // Distribute evenly, handling remainder by giving extra cents to first users
    const base = Math.floor((totalAmount / participants.length) * 100) / 100;
    let remainder = Math.round((totalAmount - base * participants.length) * 100);

    participants.forEach(uid => {
      let amount = base;
      if (remainder > 0) {
        amount += 0.01;
        remainder--;
      }
      owed[uid] = round2(amount);
    });
  }

  if (splitType === 'exact') {
    participants.forEach(uid => {
      owed[uid] = round2(splitDetails[uid]);
    });
  }

  if (splitType === 'percentage') {
    participants.forEach(uid => {
      owed[uid] = round2((splitDetails[uid] / 100) * totalAmount);
    });
  }

  if (splitType === 'shares') {
    const totalShares = Object.values(splitDetails).reduce((a, b) => a + b, 0);
    participants.forEach(uid => {
      owed[uid] = round2((splitDetails[uid] / totalShares) * totalAmount);
    });
  }

  /* ==================== CALCULATE NET BALANCES ==================== */

  const balances: Record<string, number> = {};
  
  // Get all users involved (payers + participants)
  const allUsers = new Set([...participants, ...paidBy.map(p => p.userId)]);

  allUsers.forEach(uid => {
    const paid = paidBy.find(p => p.userId === uid)?.amount || 0;
    const owes = owed[uid] || 0;
    // Positive balance = they are owed money
    // Negative balance = they owe money
    balances[uid] = round2(paid - owes);
  });

  /* ==================== SIMPLIFY DEBTS (MINIMIZE TRANSACTIONS) ==================== */

  // Separate into creditors (owed money) and debtors (owe money)
  const creditors = Object.entries(balances)
    .filter(([_, bal]) => bal > EPSILON)
    .map(([userId, amount]) => ({ userId, amount }))
    .sort((a, b) => b.amount - a.amount); // Largest creditor first

  const debtors = Object.entries(balances)
    .filter(([_, bal]) => bal < -EPSILON)
    .map(([userId, amount]) => ({ userId, amount }))
    .sort((a, b) => a.amount - b.amount); // Largest debtor first

  const settlements: Settlement[] = [];
  let i = 0, j = 0;

  // Greedy algorithm: match largest creditor with largest debtor
  while (i < creditors.length && j < debtors.length) {
    const amountToSettle = Math.min(creditors[i].amount, -debtors[j].amount);

    if (amountToSettle > EPSILON) {
      settlements.push({
        from: debtors[j].userId,
        to: creditors[i].userId,
        amount: round2(amountToSettle),
      });

      creditors[i].amount -= amountToSettle;
      debtors[j].amount += amountToSettle;
    }

    // Move to next creditor/debtor if current one is settled
    if (creditors[i].amount < EPSILON) i++;
    if (debtors[j].amount > -EPSILON) j++;
  }

  return {
    balances,
    settlements,
    isValid: true,
    errors: [],
  };
}

/**
 * Aggregate multiple expenses to get overall balances and settlements
 * Useful for showing "who owes whom overall" in a group
 */
export function aggregateExpenses(expenses: ExpenseInput[]): SplitResult {
  const aggregatedBalances = new Map<string, number>();
  const allErrors: string[] = [];

  // Sum up all balances from individual expenses
  expenses.forEach((expense, index) => {
    const result = calculateExpenseSplits(expense);
    
    if (!result.isValid) {
      allErrors.push(`Expense ${index + 1}: ${result.errors.join(', ')}`);
      return;
    }

    Object.entries(result.balances).forEach(([userId, balance]) => {
      const current = aggregatedBalances.get(userId) || 0;
      aggregatedBalances.set(userId, current + balance);
    });
  });

  if (allErrors.length > 0) {
    return {
      balances: {},
      settlements: [],
      isValid: false,
      errors: allErrors,
    };
  }

  // Convert to balances object
  const balances: Record<string, number> = {};
  aggregatedBalances.forEach((balance, userId) => {
    balances[userId] = round2(balance);
  });

  // Calculate simplified settlements for aggregated balances
  const creditors = Array.from(aggregatedBalances.entries())
    .filter(([_, bal]) => bal > EPSILON)
    .map(([userId, amount]) => ({ userId, amount }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = Array.from(aggregatedBalances.entries())
    .filter(([_, bal]) => bal < -EPSILON)
    .map(([userId, amount]) => ({ userId, amount }))
    .sort((a, b) => a.amount - b.amount);

  const settlements: Settlement[] = [];
  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const amountToSettle = Math.min(creditors[i].amount, -debtors[j].amount);

    if (amountToSettle > EPSILON) {
      settlements.push({
        from: debtors[j].userId,
        to: creditors[i].userId,
        amount: round2(amountToSettle),
      });

      creditors[i].amount -= amountToSettle;
      debtors[j].amount += amountToSettle;
    }

    if (creditors[i].amount < EPSILON) i++;
    if (debtors[j].amount > -EPSILON) j++;
  }

  return {
    balances,
    settlements,
    isValid: true,
    errors: [],
  };
}

/**
 * Helper function to format settlement messages
 */
export function formatSettlement(settlement: Settlement, getUserName: (id: string) => string): string {
  const fromName = getUserName(settlement.from);
  const toName = getUserName(settlement.to);
  return `${fromName} owes ${toName} $${settlement.amount.toFixed(2)}`;
}

/**
 * Helper to calculate equal split amounts (handles rounding)
 */
export function calculateEqualSplit(total: number, count: number): number[] {
  if (count <= 0) return [];
  
  const base = Math.floor((total / count) * 100) / 100;
  const remainder = Math.round((total - base * count) * 100);
  
  return Array(count)
    .fill(base)
    .map((val, i) => (i < remainder ? round2(val + 0.01) : val));
}