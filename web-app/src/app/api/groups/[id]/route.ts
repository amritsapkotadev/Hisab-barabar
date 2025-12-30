import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Group from '@/models/Group'
import Expense from '@/models/Expense'
import { authenticateUser } from '@/middleware/auth'

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

    return NextResponse.json({
      success: true,
      data: {
        id: group._id,
        name: group.name,
        description: group.description,
        members: group.members,
        emoji: group.emoji,
        totalExpenses,
        balances,
        inviteCode: group.inviteCode,
        inviteLink: inviteLink,
        createdAt: group.createdAt,
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
