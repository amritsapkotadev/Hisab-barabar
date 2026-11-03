import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Group from '@/models/Group'
import Expense from '@/models/Expense'
import { authenticateUser } from '@/middleware/auth'
import { calculateNetSettlements } from '@/utils/netSettlements'
import { addOrClaimMember, canAccessGroup, findMemberByUserId } from '@/utils/groupMembers'
import { calculateGroupBalances } from '@/utils/groupBalances'
import { resolveProfilePicture } from '@/lib/profilePictures'

async function serializeMember(member: any) {
  const linkedUser = member.userId && typeof member.userId === 'object' ? member.userId : null
  return {
    id: member.id,
    name: member.name,
    userId: linkedUser ? linkedUser._id : member.userId || undefined,
    picture: linkedUser ? await resolveProfilePicture(linkedUser) : undefined,
  }
}

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
    if (!canAccessGroup(group, auth.userId)) {
      return NextResponse.json(
        { message: 'Not authorized to access this group' },
        { status: 403 }
      )
    }

    // Self-heal legacy groups: link the creator to their member entry so
    // member-id based balances and expense screens work for them.
    if (
      group.createdBy.toString() === auth.userId &&
      !findMemberByUserId(group.members, auth.userId)
    ) {
      addOrClaimMember(group.members, { id: auth.userId, name: auth.user.name })
      await group.save()
    }

    await group.populate('members.userId', 'picture customPictureKey')

    // Get expenses for this group
    const expenses = await Expense.find({ groupId: group._id })

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    const balances = calculateGroupBalances(
      group.members.map(member => member.id),
      expenses,
      group.settlements ?? [],
    )

    // Generate invite link
    const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteLink = `${APP_DOMAIN}/join/${group._id}`

    return NextResponse.json({
      success: true,
      data: {
        id: group._id,
        name: group.name,
        description: group.description,
        createdBy: group.createdBy.toString(),
        members: await Promise.all(group.members.map(serializeMember)),
        emoji: group.emoji,
        totalExpenses,
        balances,
        inviteCode: group.inviteCode,
        inviteLink: inviteLink,
        createdAt: group.createdAt,
        netSettlements: calculateNetSettlements(balances),
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
