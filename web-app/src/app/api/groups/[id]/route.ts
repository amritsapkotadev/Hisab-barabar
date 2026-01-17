import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Group from '@/models/Group'
import Expense from '@/models/Expense'
import { authenticateUser } from '@/middleware/auth'
import Settlement from '@/models/Settlement'
import { calculateNetSettlements } from '@/utils/netSettlements'
import User from '@/models/User'

// Get a specific group by ID
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
    const group = await Group.findById(params.id)

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 })
    }

    // Check if user has access to this group
    const hasAccess =
      group.createdBy.toString() === auth.userId || group.members.includes(auth.user.name)

    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Not authorized to access this group' },
        { status: 403 }
      )
    }

    // Get expenses for this group
    const expenses = await Expense.find({ groupId: group._id })

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    // Calculate balances
    const balances: Record<string, number> = {}
    group.members.forEach((member) => {
      balances[member] = 0
    })

    expenses.forEach((expense) => {
      const splitAmount = expense.amount / (expense.participants?.length || 1)

      // Add to payer's balance
      if (expense.paidBy && balances.hasOwnProperty(expense.paidBy)) {
        balances[expense.paidBy] += expense.amount
      }

      // Subtract split amount from each participant
      expense.participants?.forEach((participant) => {
        if (balances.hasOwnProperty(participant)) {
          balances[participant] -= splitAmount
        }
      })
    })

    // Generate invite link
    const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteLink = `${APP_DOMAIN}/join/${group._id}`

    // Round balances to 2 decimal places
    const roundedBalances = Object.fromEntries(
      Object.entries(balances).map(([k, v]) => [k, Math.round((v + Number.EPSILON) * 100) / 100])
    );
    return NextResponse.json({
      success: true,
      data: {
        id: group._id,
        name: group.name,
        description: group.description,
        members: group.members,
        emoji: group.emoji,
        totalExpenses,
        balances: roundedBalances,
        inviteCode: group.inviteCode,
        inviteLink: inviteLink,
        createdAt: group.createdAt,
                netSettlements: calculateNetSettlements(roundedBalances),
      },
    })
  } catch (error) {
    console.error('Get group by ID error:', error)
    return NextResponse.json(
      { message: 'Server error while fetching group' },
      { status: 500 }
    )
  }
}

// Delete a group
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
    const group = await Group.findById(params.id)

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 })
    }

    // Only the creator can delete the group
    if (group.createdBy.toString() !== auth.userId) {
      return NextResponse.json(
        { message: 'Not authorized to delete this group' },
        { status: 403 }
      )
    }

    // Delete all expenses associated with this group
    await Expense.deleteMany({ groupId: params.id })

    // Delete the group
    await Group.findByIdAndDelete(params.id)

    return NextResponse.json({
      success: true,
      message: 'Group and associated expenses deleted successfully',
    })
  } catch (error) {
    console.error('Delete group error:', error)
    return NextResponse.json(
      { message: 'Server error while deleting group' },
      { status: 500 }
    )
  }
}

interface SettlementInput {
  fromUserId: string
  toUserId: string
  amount: number
  description?: string
}

interface RequestBody {
  settlements: SettlementInput[]
  settledAt?: Date
  notes?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const mongoose = (await import('mongoose')).default
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: 'Invalid group ID format' },
      { status: 400 }
    )
  }

  try {
    const body: RequestBody = await request.json()
    const { settlements, settledAt, notes } = body

    if (!Array.isArray(settlements) || settlements.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Settlements array is required and must not be empty' },
        { status: 400 }
      )
    }

    const validationErrors: string[] = []
    settlements.forEach((settlement, index) => {
      if (!settlement.fromUserId || !settlement.toUserId) {
        validationErrors.push(`Settlement ${index + 1}: fromUserId and toUserId are required`)
      }
      if (typeof settlement.amount !== 'number' || settlement.amount <= 0) {
        validationErrors.push(`Settlement ${index + 1}: amount must be a positive number`)
      }
      if (settlement.fromUserId === settlement.toUserId) {
        validationErrors.push(`Settlement ${index + 1}: cannot settle with yourself`)
      }
    })

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationErrors },
        { status: 400 }
      )
    }

    await connectDB()

    const group = await Group.findById(id)
    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      )
    }

    const settlementsWithDates = settlements.map((settlement) => ({
      fromUserId: settlement.fromUserId,
      toUserId: settlement.toUserId,
      amount: parseFloat(settlement.amount.toFixed(2)),
      date: new Date(),
      description: settlement.description || `Settlement from ${settlement.fromUserId} to ${settlement.toUserId}`,
      groupId: id,
      members: group.members,
    }))

    await Settlement.insertMany(settlementsWithDates)

    // Robust balances handling
    const balancesObj =
      group && group.balances && typeof group.balances === 'object' && !Array.isArray(group.balances)
        ? group.balances
        : {}
    const updatedBalances = new Map(Object.entries(balancesObj))
    
    settlementsWithDates.forEach((settlement) => {
      const currentFromBalance = Number(updatedBalances.get(settlement.fromUserId) ?? 0)
      updatedBalances.set(settlement.fromUserId, parseFloat((currentFromBalance - settlement.amount).toFixed(2)))

      const currentToBalance = Number(updatedBalances.get(settlement.toUserId) ?? 0)
      updatedBalances.set(settlement.toUserId, parseFloat((currentToBalance + settlement.amount).toFixed(2)))
    })
    
    // Calculate and update netSettlements
    const balancesObjForNet = Object.fromEntries(updatedBalances);
    const netSettlements = calculateNetSettlements(balancesObjForNet);

    // Only push settlementNotes if notes is provided
    const update: any = {
      $set: {
        balances: balancesObjForNet,
        netSettlements,
        settled: settlements.length > 0 ? true : group.settled,
        settledAt: settledAt || new Date(),
        updatedAt: new Date(),
      },
      $push: {
        settlements: { $each: settlementsWithDates },
      },
    };
    if (notes) {
      update.$push.settlementNotes = { note: notes, date: new Date() }
    }
    
    const updatedGroup = await Group.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
    if (!updatedGroup) {
      return NextResponse.json(
        { success: false, error: 'Failed to update group' },
        { status: 500 }
      )
    }

    // Check if all balances are settled (within small tolerance)
    const allSettled = Array.from(updatedBalances.values()).every(
balance => Math.abs(Number(balance)) < 0.01    )

    if (allSettled) {
      await Group.findByIdAndUpdate(id, {
        $set: {
          settled: true,
          settledAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Settlements recorded successfully',
      data: {
        groupId: id,
        groupName: updatedGroup.name,
        settlementCount: settlementsWithDates.length,
        totalSettled: settlementsWithDates.reduce((sum, s) => sum + s.amount, 0),
        allSettled: allSettled,
        remainingBalances: Object.fromEntries(updatedBalances),
      },
    })
  } catch (error: any) {
    console.error('Error recording settlements:', error)

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message)
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Duplicate settlement found' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to record settlements',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
