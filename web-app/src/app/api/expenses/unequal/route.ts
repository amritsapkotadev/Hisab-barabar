import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import Group from '@/models/Group'
import { authenticateUser } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()
    const { groupId, description, amount, paidBy, splits, date, payers, splitType, type } =
      await request.json()

    // Validation
    if (!groupId || !description || !amount || !date) {
      return NextResponse.json(
        { message: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { message: 'Amount must be a valid number greater than 0' },
        { status: 400 }
      )
    }

    // Validate payers if provided
    if (payers && Array.isArray(payers)) {
      for (const payer of payers) {
        if (typeof payer.amountPaid !== 'number' || isNaN(payer.amountPaid)) {
          return NextResponse.json(
            { message: `Payer amountPaid for ${payer.name} must be a valid number` },
            { status: 400 }
          )
        }
      }
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

    // Extract participants from splits
    const participants = splits ? splits.map((s: any) => s.participant) : []

    // Create expense
    const expense = new Expense({
      description: description.trim(),
      amount: typeof amount === 'string' ? parseFloat(amount) : amount,
      paidBy: paidBy?.trim(),
      participants: participants.map((p: string) => p.trim()),
      splits: splits || [],
      payers: payers || [],
      groupId,
      date,
      splitType: splitType || 'unequal',
      type: type || 'group',
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
          splits: savedExpense.splits,
          payers: savedExpense.payers,
          splitType: savedExpense.splitType,
          date: savedExpense.date,
          createdAt: savedExpense.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create unequal expense error:', error)
    return NextResponse.json(
      { message: 'Server error while creating expense' },
      { status: 500 }
    )
  }
}
