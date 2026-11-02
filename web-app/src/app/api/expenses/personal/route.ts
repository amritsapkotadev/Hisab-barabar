import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { authenticateUser } from '@/middleware/auth'
import { personalExpenseSummary } from '@/utils/personalExpenseSummary'
import { withExpenseIdempotency } from '@/lib/expenseIdempotency'

// Create personal expense
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
    const { description, amount, date, paymentMethod = 'Cash', category = 'Other', paidBy, participants } =
      await request.json()

    // Basic validation
    if (!description || !amount || !date) {
      return NextResponse.json(
        { message: 'Description, amount, and date are required.' },
        { status: 400 }
      )
    }

    if (typeof description !== 'string' || typeof amount !== 'number' || typeof date !== 'string') {
      return NextResponse.json(
        { message: 'Invalid data types for one or more fields.' },
        { status: 400 }
      )
    }

    // Create the expense
    const expense = await Expense.create({
      description,
      amount,
      date,
      type: 'personal',
      createdBy: auth.userId,
      paidBy: paidBy?.trim(),
      participants: participants ? participants.map((p: string) => p.trim()) : [],
      category,
      paymentMethod,
    })

    return NextResponse.json({ data: expense }, { status: 201 })
  } catch (error) {
    console.error('Error creating personal expense:', error)
    return NextResponse.json(
      { message: 'Something went wrong while creating the personal expense.' },
      { status: 500 }
    )
  }
}

// Get personal expenses
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    const now = new Date()
    const monthStart = new Date(
      request.nextUrl.searchParams.get('monthStart') || new Date(now.getFullYear(), now.getMonth(), 1)
    )
    const monthEnd = new Date(
      request.nextUrl.searchParams.get('monthEnd') || new Date(now.getFullYear(), now.getMonth() + 1, 1)
    )
    if (!Number.isFinite(monthStart.getTime()) || !Number.isFinite(monthEnd.getTime()) || monthStart >= monthEnd) {
      return NextResponse.json({ message: 'Invalid month boundaries' }, { status: 400 })
    }

    await connectDB()
    const expenses = await Expense.find({ createdBy: auth.userId, type: 'personal' }).sort({
      createdAt: -1,
    })

    const transformedExpenses = expenses.map((expense) => ({
      id: expense._id,
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      createdAt: expense.createdAt,
      paidBy: expense.paidBy,
      participants: expense.participants,
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      splitType: expense.splitType,
      groupId: expense.groupId,
      updatedAt: expense.updatedAt,
      revision: expense.revision ?? 0,
      type: expense.type,
      createdBy: expense.createdBy,
      splits: expense.splits,
      payers: expense.payers,
    }))

    return NextResponse.json({
      success: true,
      data: transformedExpenses,
      summary: personalExpenseSummary(expenses, monthStart, monthEnd),
    })
  } catch (error) {
    console.error('Get personal expenses error:', error)
    return NextResponse.json(
      { message: 'Server error while fetching personal expenses' },
      { status: 500 }
    )
  }
}
