import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { NextRequest } from 'next/server';
import Group from '@/models/Group';

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
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: 'Invalid group ID format' },
      { status: 400 }
    );
  }

  try {
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

    // Prepare settlements with dates
    const settlementsWithDates = settlements.map(settlement => ({
      fromUserId: settlement.fromUserId,
      toUserId: settlement.toUserId,
      amount: parseFloat(settlement.amount.toFixed(2)), // Ensure 2 decimal places
      date: new Date(),
      description: settlement.description || `Settlement from ${settlement.fromUserId} to ${settlement.toUserId}`,
    }));

    // Update balances based on settlements
    const updatedBalances = new Map(group.balances || new Map());
    
    settlementsWithDates.forEach(settlement => {
      // Deduct from sender (fromUserId)
      const currentFromBalance = updatedBalances.get(settlement.fromUserId) || 0;
      updatedBalances.set(settlement.fromUserId, parseFloat((currentFromBalance + settlement.amount).toFixed(2)));
      
      // Add to receiver (toUserId)
      const currentToBalance = updatedBalances.get(settlement.toUserId) || 0;
      updatedBalances.set(settlement.toUserId, parseFloat((currentToBalance - settlement.amount).toFixed(2)));
    });

    // Update the group
    const updatedGroup = await Group.findByIdAndUpdate(
      id,
      {
        $set: {
          settlements: [...(group.settlements || []), ...settlementsWithDates],
          balances: updatedBalances,
          settled: settlements.length > 0 ? true : group.settled,
          settledAt: settledAt || new Date(),
          updatedAt: new Date(),
        },
        $push: {
          settlementNotes: notes ? { note: notes, date: new Date() } : undefined,
        },
      },
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
      balance => Math.abs(balance) < 0.01
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
  
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: 'Invalid group ID format' },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();
    
    const group = await Group.findById(id)
      .select('name settlements settled settledAt balances totalExpenses')
      .lean();
    
    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        groupId: id,
        groupName: group.name,
        settlements: group.settlements || [],
        settled: group.settled || false,
        settledAt: group.settledAt,
        balances: group.balances ? Object.fromEntries(group.balances) : {},
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