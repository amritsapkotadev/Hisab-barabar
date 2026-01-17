import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Group } from '@/models/Group';
import Expense from '@/models/Expense'
import { authenticateUser } from '@/middleware/auth'

// Create a new group
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()
    const { name, description, members, emoji } = await request.json()

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: 'Group name is required' },
        { status: 400 }
      )
    }

    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { message: 'At least one member is required' },
        { status: 400 }
      )
    }

    // Filter out empty members
    const validMembers = members.filter((member) => member && member.trim() !== '')

    if (validMembers.length === 0) {
      return NextResponse.json(
        { message: 'At least one valid member is required' },
        { status: 400 }
      )
    }

    // Create group
    const group = new Group({
      name: name.trim(),
      description: description ? description.trim() : '',
      createdBy: auth.userId,
      members: validMembers.map((member) => member.trim()),
      emoji: emoji ? emoji.trim() : '',
    })

    const savedGroup = await group.save()

    // Generate invite link
    const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteLink = `${APP_DOMAIN}/join/${savedGroup._id}`

    return NextResponse.json(
      {
        success: true,
        data: {
          id: savedGroup._id,
          name: savedGroup.name,
          description: savedGroup.description,
          members: savedGroup.members,
          emoji: savedGroup.emoji,
          totalExpenses: 0,
          balances: {},
          inviteCode: savedGroup.inviteCode,
          inviteLink: inviteLink,
          createdAt: savedGroup.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create group error:', error)
    return NextResponse.json(
      { message: 'Server error while creating group' },
      { status: 500 }
    )
  }
}

// Get all groups for the user
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()

    // Find groups where user is either creator or member
    const groups = await Group.find({
      $or: [{ createdBy: auth.userId }, { members: auth.user.name }],
    }).sort({ createdAt: -1 })

    // Calculate expenses and balances for each group
    const groupsWithStats = await Promise.all(
      groups.map(async (group) => {
        try {
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
            const splitAmount = expense.amount / expense.participants!.length

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

          return {
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
          }
        } catch (error) {
          console.error(`Error calculating stats for group ${group._id}:`, error)
          const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          return {
            id: group._id,
            name: group.name,
            description: group.description,
            members: group.members,
            emoji: group.emoji,
            totalExpenses: 0,
            balances: {},
            inviteCode: group.inviteCode,
            inviteLink: `${APP_DOMAIN}/join/${group._id}`,
            createdAt: group.createdAt,
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: groupsWithStats,
    })
  } catch (error) {
    console.error('Get groups error:', error)
    return NextResponse.json(
      { message: 'Server error while fetching groups' },
      { status: 500 }
    )
  }
}
