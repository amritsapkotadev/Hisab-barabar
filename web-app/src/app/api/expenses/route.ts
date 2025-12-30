import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import Group from '@/models/Group'
import { authenticateUser } from '@/middleware/auth'

// Create a new group expense
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()
    const { groupId, description, amount, paidBy, participants, date } = await request.json()

    // Validation
    if (!groupId || !description || !amount || !paidBy || !participants || !date) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 })
    }

    if (!Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json(
        { message: 'At least one participant is required' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { message: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Check if group exists and user has access
    const group = await Group.findById(groupId)
    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 })
    }

    if (!group.members.includes(auth.user.name)) {
      return NextResponse.json(
        { message: 'Not authorized: you must be a group member to add expenses' },
        { status: 403 }
      )
    }

    // Validate that paidBy and participants are group members
    const validMembers = group.members
    if (!validMembers.includes(paidBy.trim())) {
      return NextResponse.json(
        { message: 'Payer must be a group member' },
        { status: 400 }
      )
    }

    const invalidParticipants = participants.filter((p: string) => !validMembers.includes(p.trim()))
    if (invalidParticipants.length > 0) {
      return NextResponse.json(
        { message: `Invalid participants: ${invalidParticipants.join(', ')}` },
        { status: 400 }
      )
    }

    // Create expense
    const expense = new Expense({
      description: description.trim(),
      amount: parseFloat(amount),
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

    // Get all groups where the user is a member
    const userGroups = await Group.find({ members: auth.user.name })
    const groupIds = userGroups.map((group) => group._id)

    // Get all group expenses
    const groupExpenses = await Expense.find({
      groupId: { $in: groupIds },
    }).sort({ createdAt: -1 })

    // Get all personal expenses for the user
    const personalExpenses = await Expense.find({
      createdBy: auth.userId,
      type: 'personal',
    }).sort({ createdAt: -1 })

    // Combine and sort all expenses
    const allExpenses = [...groupExpenses, ...personalExpenses].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Transform expenses
    const transformedExpenses = allExpenses.map((expense) => ({
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
    }))

    return NextResponse.json({
      success: true,
      data: transformedExpenses,
    })
  } catch (error) {
    console.error('Get all expenses error:', error)
    return NextResponse.json(
      { message: 'Server error while fetching expenses' },
      { status: 500 }
    )
  }
}
