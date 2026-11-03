import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import Group from '@/models/Group'
import { authenticateUser } from '@/middleware/auth'
import { canAccessGroup } from '@/utils/groupMembers'
import { Types } from 'mongoose'
import { expensePagination, expensePage } from '@/utils/expensePagination'

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
    let pagination
    try {
      pagination = expensePagination(request.nextUrl.searchParams)
    } catch (error) {
      return NextResponse.json({ message: error instanceof Error ? error.message : 'Invalid pagination' }, { status: 400 })
    }
    const filter = { groupId: new Types.ObjectId(params.groupId) }
    const query = Expense.find(filter).sort({ createdAt: -1, _id: -1 })
    if (pagination) query.skip(pagination.skip).limit(pagination.limit + 1)
    const page = expensePage(await query, pagination)
    const [totals] = pagination ? await Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]) : []

    // Transform expenses
    const transformedExpenses = page.rows.map((expense) => ({
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
      ...(page.pageInfo && {
        pageInfo: page.pageInfo,
        summary: { count: totals?.count ?? 0, totalAmount: totals?.totalAmount ?? 0 },
      }),
    })
  } catch (error) {
    console.error('Get expenses error:', error)
    return NextResponse.json(
      { message: 'Server error while fetching expenses' },
      { status: 500 }
    )
  }
}
