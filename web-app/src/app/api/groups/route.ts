import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Group from '@/models/Group'
import Expense from '@/models/Expense'
import { authenticateUser } from '@/middleware/auth'
import { buildMembersFromNames } from '@/utils/groupMembers'
import { calculateGroupBalances } from '@/utils/groupBalances'

// Serialize a group member for API responses, surfacing the linked
// account's picture (if any) so clients can show a real avatar without an
// extra lookup, while keeping the stable `id` as the source of truth.
function serializeMember(member: any) {
  const linkedUser = member.userId && typeof member.userId === 'object' ? member.userId : null
  return {
    id: member.id,
    name: member.name,
    userId: linkedUser ? linkedUser._id : member.userId || undefined,
    picture: linkedUser ? linkedUser.picture : undefined,
  }
}

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

    const groupMembers = buildMembersFromNames(members)

    if (groupMembers.length === 0) {
      return NextResponse.json(
        { message: 'At least one valid member is required' },
        { status: 400 }
      )
    }

    // Link the creator's own entry to their real account, if their name was
    // included among the members (the mobile app pre-fills it).
    const creatorEntry = groupMembers.find(
      (member) => member.name.trim().toLowerCase() === auth.user.name.trim().toLowerCase()
    )
    if (creatorEntry) {
      creatorEntry.userId = auth.userId as any
    }

    // Create group
    const group = new Group({
      name: name.trim(),
      description: description ? description.trim() : '',
      createdBy: auth.userId,
      members: groupMembers,
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
          createdBy: savedGroup.createdBy.toString(),
          members: savedGroup.members.map(serializeMember),
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

    // Find groups where user is either creator or a linked member
    const groups = await Group.find({
      $or: [{ createdBy: auth.userId }, { 'members.userId': auth.userId }],
    })
      .sort({ createdAt: -1 })
      .populate('members.userId', 'picture')

    // Calculate expenses and balances for each group
    const groupsWithStats = await Promise.all(
      groups.map(async group => {
        const expenses = await Expense.find({ groupId: group._id })
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
        const balances = calculateGroupBalances(
          group.members.map(member => member.id),
          expenses,
          group.settlements ?? [],
        )
        const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        return {
          id: group._id,
          name: group.name,
          description: group.description,
          createdBy: group.createdBy.toString(),
          members: group.members.map(serializeMember),
          emoji: group.emoji,
          totalExpenses,
          balances,
          inviteCode: group.inviteCode,
          inviteLink: `${APP_DOMAIN}/join/${group._id}`,
          createdAt: group.createdAt,
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
