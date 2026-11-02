import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import type { NextRequest } from 'next/server';
import Settlement from '@/models/Settlement';
import Group from '@/models/Group';
import Expense from '@/models/Expense';
import { calculateNetSettlements } from '@/utils/netSettlements';
import { authenticateUser } from '@/middleware/auth';
import { findMemberByUserId } from '@/utils/groupMembers';
import { calculateGroupBalances } from '@/utils/groupBalances';

// Type definitions
interface SettlementInput {
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
}

interface RequestBody {
  settlements: SettlementInput[];
  settledAt?: Date;
  notes?: string;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  
  // Validate group ID
  const mongoose = (await import('mongoose')).default;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: 'Invalid group ID format' },
      { status: 400 }
    );
  }

  try {
    const auth = await authenticateUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    // Parse and validate request body
    const body: RequestBody = await request.json();
    const { settlements, settledAt, notes } = body;

    // Validate settlements array
    if (!Array.isArray(settlements) || settlements.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Settlements array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate each settlement
    const validationErrors: string[] = [];
    settlements.forEach((settlement, index) => {
      if (!settlement.fromUserId || !settlement.toUserId) {
        validationErrors.push(`Settlement ${index + 1}: fromUserId and toUserId are required`);
      }
      if (typeof settlement.amount !== 'number' || settlement.amount <= 0) {
        validationErrors.push(`Settlement ${index + 1}: amount must be a positive number`);
      }
      if (settlement.fromUserId === settlement.toUserId) {
        validationErrors.push(`Settlement ${index + 1}: cannot settle with yourself`);
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find the group
    const group = await Group.findById(id);
    
    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      );
    }

    const hasAccess =
      group.createdBy.toString() === auth.userId ||
      !!findMemberByUserId(group.members, auth.userId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to settle this group' },
        { status: 403 }
      );
    }

    const memberIds = new Set(group.members.map((member) => member.id));
    const invalidMemberErrors = settlements
      .filter((s) => !memberIds.has(s.fromUserId) || !memberIds.has(s.toUserId))
      .map((_s, index) => `Settlement ${index + 1}: fromUserId/toUserId must be group members`);
    if (invalidMemberErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: invalidMemberErrors },
        { status: 400 }
      );
    }

    // Prepare settlements with dates and groupId
    const settlementsWithDates = settlements.map(settlement => ({
      fromUserId: settlement.fromUserId,
      toUserId: settlement.toUserId,
      amount: parseFloat(settlement.amount.toFixed(2)), // Ensure 2 decimal places
      date: new Date(),
      description: settlement.description || `Settlement from ${settlement.fromUserId} to ${settlement.toUserId}`,
      groupId: id,
    }));

    // Update balances based on settlements
    // Ensure balances is always a plain object for Map
    const expenses = await Expense.find({ groupId: group._id });
    const currentBalances = calculateGroupBalances(
      group.members.map(member => member.id),
      expenses,
      group.settlements ?? [],
    );
    const updatedBalances = new Map(Object.entries(currentBalances));

    // Balances are payer-positive: money paid by `from` reduces their debt
    // (balance moves up toward zero), and money received by `to` reduces
    // their credit (balance moves down toward zero).
    for (const settlement of settlementsWithDates) {
      const currentFromBalance = Number(updatedBalances.get(settlement.fromUserId) ?? 0);
      const currentToBalance = Number(updatedBalances.get(settlement.toUserId) ?? 0);
      if (currentFromBalance >= 0 || currentToBalance <= 0 ||
          settlement.amount > Math.min(-currentFromBalance, currentToBalance) + 0.01) {
        return NextResponse.json(
          { success: false, error: 'Settlement exceeds the current debt between group members' },
          { status: 400 }
        );
      }
      updatedBalances.set(
        settlement.fromUserId,
        parseFloat((currentFromBalance + settlement.amount).toFixed(2))
      );

      updatedBalances.set(
        settlement.toUserId,
        parseFloat((currentToBalance - settlement.amount).toFixed(2))
      );
    }

    // Save only after the entire request is confirmed against current balances.
    await Settlement.insertMany(settlementsWithDates);

    // Recalculate netSettlements after updating balances
    const balancesObjForNet = Object.fromEntries(updatedBalances);
    const netSettlementsArr = calculateNetSettlements(balancesObjForNet);

    // Update the group
    const update: any = {
      $set: {
        settlements: [...(group.settlements || []), ...settlementsWithDates],
        balances: balancesObjForNet, // Persist updated balances
        netSettlements: netSettlementsArr, // Persist recalculated netSettlements
        settled: settlements.length > 0 ? true : group.settled,
        settledAt: settledAt || new Date(),
        updatedAt: new Date(),
      },
    };
    if (notes) {
      update.$push = { settlementNotes: { note: notes, date: new Date() } };
    }
    const updatedGroup = await Group.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!updatedGroup) {
      return NextResponse.json(
        { success: false, error: 'Failed to update group' },
        { status: 500 }
      );
    }

    // Check if all balances are settled (within small tolerance)
    const allSettled = Array.from(updatedBalances.values()).every(
      balance => Math.abs(Number(balance)) < 0.01
    );

    // If all settled, update the group status
    if (allSettled) {
      await Group.findByIdAndUpdate(id, {
        $set: {
          settled: true,
          settledAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Settlements recorded successfully',
      data: {
        groupId: id,
        groupName: updatedGroup.name,
        settlementCount: settlementsWithDates.length,
        totalSettled: settlementsWithDates.reduce((sum, s) => sum + s.amount, 0),
        allSettled: allSettled,
        remainingBalances: Object.fromEntries(updatedBalances),
      },
    });
  } catch (error: any) {
    console.error('Error recording settlements:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Duplicate settlement found' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to record settlements',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  
  // Validate group ID
  const mongoose = (await import('mongoose')).default;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: 'Invalid group ID format' },
      { status: 400 }
    );
  }

  try {
    const auth = await authenticateUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    await connectToDatabase();
    
    const group = await Group.findById(id)
      .select('name settlements settled settledAt balances totalExpenses createdBy members')
      .lean();
    
    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      );
    }

    const hasAccess =
      group.createdBy.toString() === auth.userId ||
      !!findMemberByUserId(group.members, auth.userId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to view this group' },
        { status: 403 }
      );
    }

    // Handle balances properly - group.balances is already an object when using .lean()
    const balances = group.balances || {};

    return NextResponse.json({
      success: true,
      data: {
        groupId: id,
        groupName: group.name,
        settlements: group.settlements || [],
        settled: group.settled || false,
        settledAt: group.settledAt,
        balances: balances, // Already an object, no need for Object.fromEntries
        totalExpenses: group.totalExpenses || 0,
        settlementSummary: {
          totalSettled: (group.settlements || []).reduce((sum: number, s: any) => sum + s.amount, 0),
          count: (group.settlements || []).length,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching settlements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settlements' },
      { status: 500 }
    );
  }
}