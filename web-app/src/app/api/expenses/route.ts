import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import Group from '@/models/Group'
import { authenticateUser } from '@/middleware/auth'
import { canAccessGroup } from '@/utils/groupMembers'
import { withExpenseIdempotency } from '@/lib/expenseIdempotency'
import { calculateGroupBalances } from '@/utils/groupBalances'
import { Types } from 'mongoose'
import { expensePagination, expensePage } from '@/utils/expensePagination'

// Create a new group expense
export async function POST(request: NextRequest) {
  return withExpenseIdempotency(request, () => createExpense(request))
}

async function createExpense(request: NextRequest) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()
    const { groupId, description, amount, paidBy, participants, date } = await request.json()

    // Validation
    if (typeof groupId !== 'string' || typeof description !== 'string' ||
        !description.trim() || typeof paidBy !== 'string' || !paidBy.trim() ||
        typeof date !== 'string' || !date || participants === undefined) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 })
    }

    if (!Array.isArray(participants) || participants.length === 0 ||
        participants.some((participant: unknown) => typeof participant !== 'string') ||
        new Set(participants).size !== participants.length) {
      return NextResponse.json(
        { message: 'Participants must be unique group member ids' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { message: 'Amount must be a valid number greater than 0' },
        { status: 400 }
      )
    }

    // Check if group exists and user has access
    const group = await Group.findById(groupId)
    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 })
    }

    if (!canAccessGroup(group, auth.userId)) {
      return NextResponse.json(
        { message: 'Not authorized: you must be a group member to add expenses' },
        { status: 403 }
      )
    }

    // Validate that paidBy and participants are real group member ids
    const validMemberIds = group.members.map((member) => member.id)
    if (!validMemberIds.includes(paidBy.trim())) {
      return NextResponse.json(
        { message: 'Payer must be a group member' },
        { status: 400 }
      )
    }

    const invalidParticipants = participants.filter((p: string) => !validMemberIds.includes(p.trim()))
    if (invalidParticipants.length > 0) {
      return NextResponse.json(
        { message: `Invalid participants: ${invalidParticipants.join(', ')}` },
        { status: 400 }
      )
    }

    try {
      calculateGroupBalances(validMemberIds, [{
        amount,
        paidBy,
        participants,
        splitType: 'equal',
      }])
    } catch (error) {
      return NextResponse.json({
        message: error instanceof Error ? error.message : 'Expense allocations are invalid',
      }, { status: 400 })
    }

    // Create expense
    const expense = new Expense({
      description: description.trim(),
      amount,
      paidBy: paidBy.trim(),
      participants: participants.map((p: string) => p.trim()),
      groupId,
      date,
      splitType: 'equal',
      type: 'group',
      createdBy: auth.userId,
    })

    const savedExpense = await expense.save()

    return NextResponse.json(
      {
        success: true,
        data: {
          id: savedExpense._id,
          groupId: savedExpense.groupId,
          description: savedExpense.description,
          amount: savedExpense.amount,
          paidBy: savedExpense.paidBy,
          participants: savedExpense.participants,
          splitType: savedExpense.splitType,
          date: savedExpense.date,
          createdAt: savedExpense.createdAt,
          updatedAt: savedExpense.updatedAt,
          revision: savedExpense.revision ?? 0,
          type: savedExpense.type,
          createdBy: savedExpense.createdBy,
          category: savedExpense.category,
          paymentMethod: savedExpense.paymentMethod,
          splits: savedExpense.splits,
          payers: savedExpense.payers,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create expense error:', error)
    return NextResponse.json(
      { message: 'Server error while creating expense' },
      { status: 500 }
    )
  }
}

// Get all expenses for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()

    // Include creators even when a legacy group's creator has no member row.
    const userGroups = await Group.find({
      $or: [{ 'members.userId': auth.userId }, { createdBy: auth.userId }],
    })
    const groupIds = userGroups.map((group) => group._id)

    let pagination
    try {
      pagination = expensePagination(request.nextUrl.searchParams)
    } catch (error) {
      return NextResponse.json({ message: error instanceof Error ? error.message : 'Invalid pagination' }, { status: 400 })
    }
    const type = request.nextUrl.searchParams.get('type')
    if (type !== null && type !== 'group' && type !== 'personal') {
      return NextResponse.json({ message: 'Invalid expense type' }, { status: 400 })
    }
    const after = request.nextUrl.searchParams.get('createdAfter')
    if (after !== null && !Number.isFinite(Date.parse(after))) {
      return NextResponse.json({ message: 'Invalid createdAfter date' }, { status: 400 })
    }
    const filter = {
      $or: [
        { groupId: { $in: groupIds } },
        { createdBy: new Types.ObjectId(auth.userId), type: 'personal' },
      ],
      ...(type && { type }),
      ...(after && { createdAt: { $gte: new Date(after) } }),
    }
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
      type: expense.type,
      updatedAt: expense.updatedAt,
      revision: expense.revision ?? 0,
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
    console.error('Get all expenses error:', error)
    return NextResponse.json(
      { message: 'Server error while fetching expenses' },
      { status: 500 }
    )
  }
}
