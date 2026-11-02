import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import Group from '@/models/Group'
import { authenticateUser } from '@/middleware/auth'
import { sendPushNotification } from '@/lib/firebase' // Add this import
import User from '@/models/User'
import { canAccessGroup } from '@/utils/groupMembers'
import { withExpenseIdempotency } from '@/lib/expenseIdempotency'
import { calculateGroupBalances } from '@/utils/groupBalances'


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
    const { groupId, description, amount, paidBy, splits, date, payers, splitType, type } =
      await request.json()

    // Validation
    if (typeof groupId !== 'string' || typeof description !== 'string' ||
        !description.trim() || typeof date !== 'string' || !date ||
        (paidBy !== undefined && typeof paidBy !== 'string')) {
      return NextResponse.json(
        { message: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { message: 'Amount must be a valid number greater than 0' },
        { status: 400 }
      )
    }

    // Validate payers if provided
    if (payers !== undefined && (!Array.isArray(payers) || payers.some((payer: unknown) =>
      !payer || typeof payer !== 'object' || !('name' in payer) ||
      typeof payer.name !== 'string' || !('amountPaid' in payer) ||
      typeof payer.amountPaid !== 'number' || !Number.isFinite(payer.amountPaid)))) {
      return NextResponse.json({ message: 'Payers must include a member id and numeric amount' }, { status: 400 })
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

    // Extract participants from splits
    if (!Array.isArray(splits) || splits.length === 0) {
      return NextResponse.json({ message: 'At least one valid participant split is required' }, { status: 400 })
    }
    if (splits.some((split: unknown) =>
      !split || typeof split !== 'object' || !('participant' in split) ||
      typeof split.participant !== 'string' || !('amount' in split) ||
      typeof split.amount !== 'number' || !Number.isFinite(split.amount))) {
      return NextResponse.json({ message: 'Participant splits must have unique members and numeric amounts' }, { status: 400 })
    }
    const participants = splits.map((split: { participant: string }) => split.participant)
    if (new Set(participants).size !== participants.length) {
      return NextResponse.json({ message: 'Participant splits must have unique members and numeric amounts' }, { status: 400 })
    }

    // Validate that paidBy, participants, and payers are real group member ids
    const validMemberIds = group.members.map((member) => member.id)
    if (paidBy && !validMemberIds.includes(paidBy.trim())) {
      return NextResponse.json({ message: 'Payer must be a group member' }, { status: 400 })
    }
    const invalidParticipants = participants.filter((p: string) => !validMemberIds.includes((p || '').trim()))
    if (invalidParticipants.length > 0) {
      return NextResponse.json(
        { message: `Invalid participants: ${invalidParticipants.join(', ')}` },
        { status: 400 }
      )
    }
    if (payers) {
      if (new Set(payers.map((payer: { name: string }) => payer.name)).size !== payers.length) {
        return NextResponse.json({ message: 'Payers must be unique group members' }, { status: 400 })
      }
      const invalidPayers = payers.filter((payer: any) => !validMemberIds.includes((payer.name || '').trim()))
      if (invalidPayers.length > 0) {
        return NextResponse.json(
          { message: 'Invalid payers: must be group members' },
          { status: 400 }
        )
      }
    }

    try {
      calculateGroupBalances(validMemberIds, [{
        amount,
        paidBy,
        participants: participants as string[],
        splits,
        payers,
        splitType,
      }])
    } catch (error) {
      return NextResponse.json({
        message: error instanceof Error ? error.message : 'Expense allocations are invalid',
      }, { status: 400 })
    }

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

    try {
      const linkedUserIds = group.members.filter((member) => member.userId).map((member) => member.userId)
      const members = await User.find({ _id: { $in: linkedUserIds } })
      for (const member of members) {
      if (member.fcmToken && member._id.toString() !== auth.userId) {
        await sendPushNotification(
        member.fcmToken,
        'New Expense Added',
        `${auth.user.name} added expense: ${description} (₹${amount})`,
        {
          groupId: group._id.toString(),
          groupName: group.name,
          expenseId: savedExpense._id.toString(),
          userId: auth.userId,
          userName: auth.user.name,
        }
        )
      }
      }
    } catch (error) {
      console.error('Error sending FCM notification:', error)
    }

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
          updatedAt: savedExpense.updatedAt,
          revision: savedExpense.revision ?? 0,
          type: savedExpense.type,
          createdBy: savedExpense.createdBy,
          category: savedExpense.category,
          paymentMethod: savedExpense.paymentMethod,
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
