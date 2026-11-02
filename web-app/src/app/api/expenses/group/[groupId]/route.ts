import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import Group from '@/models/Group'
import { authenticateUser } from '@/middleware/auth'
import { canAccessGroup } from '@/utils/groupMembers'

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()

    // Check if group exists and user has access
    const group = await Group.findById(params.groupId)
    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 })
    }

    if (!canAccessGroup(group, auth.userId)) {
      return NextResponse.json(
        { message: 'Not authorized: you must be a group member to access this group' },
        { status: 403 }
      )
    }

    // Get expenses for the group
    const expenses = await Expense.find({ groupId: params.groupId }).sort({ createdAt: -1 })

    // Transform expenses
    const transformedExpenses = expenses.map((expense) => ({
      id: expense._id,
      groupId: expense.groupId,
      description: expense.description,
      amount: expense.amount,
      paidBy: expense.paidBy,
      participants: expense.participants,
      splits: expense.splits,
      payers: expense.payers,
      splitType: expense.splitType,
      date: expense.date,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      revision: expense.revision ?? 0,
      type: expense.type,
      createdBy: expense.createdBy,
      category: expense.category,
      paymentMethod: expense.paymentMethod,
    }))

    return NextResponse.json({
      success: true,
      data: transformedExpenses,
    })
  } catch (error) {
    console.error('Get expenses error:', error)
    return NextResponse.json(
      { message: 'Server error while fetching expenses' },
      { status: 500 }
    )
  }
}
