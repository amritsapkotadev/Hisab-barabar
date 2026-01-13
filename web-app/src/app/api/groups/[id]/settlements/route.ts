import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import Expense from '@/models/Expense';
import { authenticateUser } from '@/middleware/auth';
import mongoose from 'mongoose';

// Utility: Splitwise-style debt simplification
function simplifyDebts(balances: Record<string, number>) {
  const creditors: { name: string; amount: number }[] = [];
  const debtors: { name: string; amount: number }[] = [];
  Object.entries(balances).forEach(([name, amount]) => {
    if (amount > 0.01) creditors.push({ name, amount });
    else if (amount < -0.01) debtors.push({ name, amount: -amount });
  });
  const settlements: any[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settleAmount = Math.min(debtor.amount, creditor.amount);
    settlements.push({
      from: debtor.name,
      to: creditor.name,
      amount: Number(settleAmount.toFixed(2)),
    });
    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;
    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }
  return settlements;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateUser(request);
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    await connectDB();
    let group = null;
    if (mongoose.Types.ObjectId.isValid(params.id)) {
      group = await Group.findById(new mongoose.Types.ObjectId(params.id));
    }
    if (!group) {
      // Try as string ID (for legacy or non-ObjectId DBs)
      group = await Group.findOne({ _id: params.id });
    }
    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }
    // Check access
    const hasAccess = group.createdBy.toString() === auth.userId || group.members.includes(auth.user.name);
    if (!hasAccess) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
    }
    // Get expenses
    const expenses = await Expense.find({ groupId: group._id });
    // Calculate balances
    const balances: Record<string, number> = {};
    group.members.forEach((member: string) => { balances[member] = 0; });
    expenses.forEach((expense: any) => {
      const splitAmount = expense.amount / (expense.participants?.length || 1);
      if (expense.paidBy && balances.hasOwnProperty(expense.paidBy)) {
        balances[expense.paidBy] += expense.amount;
      }
      expense.participants?.forEach((participant: string) => {
        if (balances.hasOwnProperty(participant)) {
          balances[participant] -= splitAmount;
        }
      });
    });
    // Simplify debts
    const settlements = simplifyDebts(balances);
    return NextResponse.json({ data: settlements });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Failed to fetch settlements' }, { status: 500 });
  }
}
