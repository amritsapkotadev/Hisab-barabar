import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { authenticateUser } from '@/middleware/auth'
import { personalExpenseSummary } from '@/utils/personalExpenseSummary'
import { withExpenseIdempotency } from '@/lib/expenseIdempotency'
import { Types } from 'mongoose'
import { expensePagination, expensePage } from '@/utils/expensePagination'

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
    let pagination
    try {
      pagination = expensePagination(request.nextUrl.searchParams)
    } catch (error) {
      return NextResponse.json({ message: error instanceof Error ? error.message : 'Invalid pagination' }, { status: 400 })
    }
    const filter = { createdBy: new Types.ObjectId(auth.userId), type: 'personal' }
    const query = Expense.find(filter).sort({ createdAt: -1, _id: -1 })
    if (pagination) query.skip(pagination.skip).limit(pagination.limit + 1)
    const expenses = await query
    const page = expensePage(expenses, pagination)
    const [totals] = pagination ? await Expense.aggregate([
      { $match: filter },
      { $set: { expenseDate: { $convert: {
        input: { $cond: [{ $eq: ['$date', ''] }, '$createdAt', { $ifNull: ['$date', '$createdAt'] }] },
        to: 'date', onError: null, onNull: null,
      } } } },
      { $group: {
        _id: null,
        count: { $sum: 1 },
        monthlySpent: { $sum: { $cond: [
          { $and: [
            { $gte: ['$expenseDate', monthStart] },
            { $lt: ['$expenseDate', monthEnd] },
          ] },
          '$amount', 0,
        ] } },
      } },
    ]) : []

    const transformedExpenses = page.rows.map((expense) => ({
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
      budget: auth.user.budget ?? 0,
      summary: pagination
        ? { count: totals?.count ?? 0, monthlySpent: totals?.monthlySpent ?? 0 }
        : personalExpenseSummary(expenses, monthStart, monthEnd),
      ...(page.pageInfo && { pageInfo: page.pageInfo }),
    })
  } catch (error) {
    console.error('Get personal expenses error:', error)
    return NextResponse.json(
      { message: 'Server error while fetching personal expenses' },
      { status: 500 }
    )
  }
}
