import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { authenticateUser } from '@/middleware/auth'

// Create personal expense
export async function POST(request: NextRequest) {
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
      splitType: expense.splitType,
      groupId: expense.groupId,
    }))

    return NextResponse.json({
      success: true,
      data: transformedExpenses,
    })
  } catch (error) {
    console.error('Get personal expenses error:', error)
    return NextResponse.json(
      { message: 'Server error while fetching personal expenses' },
      { status: 500 }
    )
  }
}
