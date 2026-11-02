import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import Group from '@/models/Group'
import { authenticateUser } from '@/middleware/auth'
import { canAccessGroup } from '@/utils/groupMembers'
import { expenseRevisionFilter, readExpenseRevision } from '@/lib/expenseRevision'
import { withExpenseIdempotency } from '@/lib/expenseIdempotency'
import { calculateGroupBalances } from '@/utils/groupBalances'

function isSplit(value: unknown): value is { participant: string; amount?: number } {
  return !!value && typeof value === 'object' && 'participant' in value &&
    typeof value.participant === 'string' &&
    (!('amount' in value) || typeof value.amount === 'number')
}

function isPayer(value: unknown): value is { name: string; amountPaid: number } {
  return !!value && typeof value === 'object' && 'name' in value &&
    typeof value.name === 'string' && 'amountPaid' in value &&
    typeof value.amountPaid === 'number'
}

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

    // Group expenses are visible to the group creator and linked members;
    // personal expenses are visible only to their owner.
    if (expense.groupId) {
      const group = await Group.findById(expense.groupId)
      if (!group || !canAccessGroup(group, auth.userId)) {
        return NextResponse.json({ message: 'Not authorized to view this expense' }, { status: 403 })
      }
    } else if (expense.createdBy.toString() !== auth.userId) {
      return NextResponse.json({ message: 'Not authorized to view this expense' }, { status: 403 })
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
        updatedAt: expense.updatedAt,
        revision: expense.revision ?? 0,
        type: expense.type,
        createdBy: expense.createdBy,
        category: expense.category,
        paymentMethod: expense.paymentMethod,
      },
    }, { headers: { ETag: `"${expense.revision ?? 0}"`, 'Cache-Control': 'no-store' } })
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
  return withExpenseIdempotency(request, () => updateExpense(request, params))
}

async function updateExpense(
  request: NextRequest,
  { id }: { id: string }
) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()
    const expense = await Expense.findById(id)
    
    if (!expense) {
      return NextResponse.json({ message: 'Expense not found' }, { status: 404 })
    }

    // Check if user has permission to update
    let group = null
    if (expense.groupId) {
      group = await Group.findById(expense.groupId)
      if (!group || !canAccessGroup(group, auth.userId)) {
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

    const revision = readExpenseRevision(request.headers.get('If-Match'), expense.revision ?? 0)
    if (revision === null) {
      return NextResponse.json({ message: 'If-Match must be a quoted nonnegative integer revision' }, { status: 400 })
    }
    if (revision === Number.MAX_SAFE_INTEGER) {
      return NextResponse.json({ message: 'Expense revision limit reached. Manual review required.' }, { status: 409 })
    }
    const body = await request.json()

    // Whitelist updatable fields to avoid writing arbitrary client data
    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'description', 'amount', 'paidBy', 'participants', 'category',
      'paymentMethod', 'splits', 'payers', 'splitType', 'date',
    ] as const
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field]
    }

    if (group) {
      const validMemberIds = group.members.map(member => member.id)
      const nextAmount = updateData.amount === undefined ? expense.amount : updateData.amount
      const nextPaidBy = updateData.paidBy === undefined ? expense.paidBy : updateData.paidBy
      const nextParticipants = updateData.participants === undefined
        ? expense.participants ?? [] : updateData.participants
      const splitSource = updateData.splits === undefined ? expense.splits ?? [] : updateData.splits
      const payerSource = updateData.payers === undefined ? expense.payers ?? [] : updateData.payers
      const nextSplitType = updateData.splitType === undefined ? expense.splitType : updateData.splitType

      if (typeof nextAmount !== 'number' || !Number.isFinite(nextAmount) ||
          typeof nextPaidBy !== 'string' ||
          !Array.isArray(nextParticipants) ||
          nextParticipants.some((participant: unknown) => typeof participant !== 'string') ||
          !Array.isArray(splitSource) || !splitSource.every(isSplit) ||
          !Array.isArray(payerSource) || !payerSource.every(isPayer) ||
          typeof nextSplitType !== 'string') {
        return NextResponse.json({ message: 'Expense allocations are invalid' }, { status: 400 })
      }

      if (new Set(nextParticipants).size !== nextParticipants.length ||
          new Set(splitSource.map(split => split.participant)).size !== splitSource.length ||
          new Set(payerSource.map(payer => payer.name)).size !== payerSource.length) {
        return NextResponse.json({ message: 'Expense allocations must use unique group members' }, { status: 400 })
      }
      if (!validMemberIds.includes(nextPaidBy) ||
          nextParticipants.some((participant: string) => !validMemberIds.includes(participant)) ||
          splitSource.some(split => !validMemberIds.includes(split.participant)) ||
          payerSource.some(payer => !validMemberIds.includes(payer.name))) {
        return NextResponse.json({ message: 'Expense allocations must reference group members' }, { status: 400 })
      }
      if (splitSource.length &&
          (new Set(splitSource.map(split => split.participant)).size !== new Set(nextParticipants).size ||
           splitSource.some(split => !nextParticipants.includes(split.participant)))) {
        return NextResponse.json({ message: 'Expense participants must match the saved splits' }, { status: 400 })
      }

      try {
        calculateGroupBalances(validMemberIds, [{
          amount: nextAmount,
          paidBy: nextPaidBy,
          participants: nextParticipants,
          splits: splitSource,
          payers: payerSource,
          splitType: nextSplitType,
        }])
      } catch (error) {
        return NextResponse.json({
          message: error instanceof Error ? error.message : 'Expense allocations are invalid',
        }, { status: 400 })
      }
    }

    // Update the expense
    const updatedExpense = await Expense.findOneAndUpdate(
      expenseRevisionFilter(id, revision),
      { $set: updateData, $inc: { revision: 1 } },
      { new: true, runValidators: true }
    )

    if (!updatedExpense) {
      return NextResponse.json({ code: 'EXPENSE_CONFLICT', message: 'Expense changed or was deleted. Refresh and review before saving.' }, { status: 409 })
    }
    return NextResponse.json({
      success: true,
      data: {
        id: updatedExpense!._id,
        groupId: updatedExpense!.groupId,
        description: updatedExpense!.description,
        amount: updatedExpense!.amount,
        paidBy: updatedExpense!.paidBy,
        participants: updatedExpense!.participants,
        category: updatedExpense!.category,
        paymentMethod: updatedExpense!.paymentMethod,
        splits: updatedExpense!.splits,
        payers: updatedExpense!.payers,
        splitType: updatedExpense!.splitType,
        date: updatedExpense!.date,
        createdAt: updatedExpense!.createdAt,
        updatedAt: updatedExpense.updatedAt,
        revision: updatedExpense.revision,
        type: updatedExpense.type,
        createdBy: updatedExpense.createdBy,
      },
      message: 'Expense updated successfully',
    }, { headers: { ETag: `"${updatedExpense.revision}"`, 'Cache-Control': 'no-store' } })
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
  return withExpenseIdempotency(request, () => deleteExpense(request, params))
}

async function deleteExpense(
  request: NextRequest,
  { id }: { id: string }
) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()
    const expense = await Expense.findById(id)
    
    if (!expense) {
      return NextResponse.json({ message: 'Expense not found' }, { status: 404 })
    }

    // Check if user has permission to delete
    if (expense.groupId) {
      const group = await Group.findById(expense.groupId)
      if (!group || !canAccessGroup(group, auth.userId)) {
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

    const revision = readExpenseRevision(request.headers.get('If-Match'), expense.revision ?? 0)
    if (revision === null) {
      return NextResponse.json({ message: 'If-Match must be a quoted nonnegative integer revision' }, { status: 400 })
    }
    const deletedExpense = await Expense.findOneAndDelete(expenseRevisionFilter(id, revision))
    if (!deletedExpense) {
      return NextResponse.json({ code: 'EXPENSE_CONFLICT', message: 'Expense changed or was deleted. Refresh and review before deleting.' }, { status: 409 })
    }

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
