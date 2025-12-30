import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import Group from '@/models/Group'
import { authenticateUser } from '@/middleware/auth'

// Get expense by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()
    const expense = await Expense.findById(params.id)
    
    if (!expense) {
      return NextResponse.json({ message: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
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
      },
    })
  } catch (error) {
    console.error('Get expense by ID error:', error)
    return NextResponse.json(
      { message: 'Server error while fetching expense' },
      { status: 500 }
    )
  }
}

// Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()
    const expense = await Expense.findById(params.id)
    
    if (!expense) {
      return NextResponse.json({ message: 'Expense not found' }, { status: 404 })
    }

    // Check if user has permission to update
    if (expense.groupId) {
      const group = await Group.findById(expense.groupId)
      if (!group || !group.members.includes(auth.user.name)) {
        return NextResponse.json(
          { message: 'Not authorized to update this expense' },
          { status: 403 }
        )
      }
    } else if (expense.createdBy.toString() !== auth.userId) {
      return NextResponse.json(
        { message: 'Not authorized to update this expense' },
        { status: 403 }
      )
    }

    const updateData = await request.json()
    
    // Update the expense
    const updatedExpense = await Expense.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    )

    return NextResponse.json({
      success: true,
      data: {
        id: updatedExpense!._id,
        groupId: updatedExpense!.groupId,
        description: updatedExpense!.description,
        amount: updatedExpense!.amount,
        paidBy: updatedExpense!.paidBy,
        participants: updatedExpense!.participants,
        splits: updatedExpense!.splits,
        payers: updatedExpense!.payers,
        splitType: updatedExpense!.splitType,
        date: updatedExpense!.date,
        createdAt: updatedExpense!.createdAt,
      },
      message: 'Expense updated successfully',
    })
  } catch (error) {
    console.error('Update expense error:', error)
    return NextResponse.json(
      { message: 'Server error while updating expense' },
      { status: 500 }
    )
  }
}

// Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()
    const expense = await Expense.findById(params.id)
    
    if (!expense) {
      return NextResponse.json({ message: 'Expense not found' }, { status: 404 })
    }

    // Check if user has permission to delete
    if (expense.groupId) {
      const group = await Group.findById(expense.groupId)
      if (!group || !group.members.includes(auth.user.name)) {
        return NextResponse.json(
          { message: 'Not authorized to delete this expense' },
          { status: 403 }
        )
      }
    } else if (expense.createdBy.toString() !== auth.userId) {
      return NextResponse.json(
        { message: 'Not authorized to delete this expense' },
        { status: 403 }
      )
    }

    await Expense.findByIdAndDelete(params.id)

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully',
    })
  } catch (error) {
    console.error('Delete expense error:', error)
    return NextResponse.json(
      { message: 'Server error while deleting expense' },
      { status: 500 }
    )
  }
}
