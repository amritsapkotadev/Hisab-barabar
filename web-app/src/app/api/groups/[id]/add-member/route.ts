import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Group from '@/models/Group'
import User from '@/models/User'
import { authenticateUser } from '@/middleware/auth'
import { sendPushNotification } from '@/lib/firebase'
import { addOrClaimMember, findMemberByUserId } from '@/utils/groupMembers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()
    const { phone } = await request.json()

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { message: 'Phone number is required' },
        { status: 400 }
      )
    }

    const normalizedPhone = phone.trim()

    const group = await Group.findById(params.id)
    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 })
    }

    // Ensure requester has access (creator or existing member)
    const requesterName = auth.user.name
    const hasAccess =
      group.createdBy.toString() === auth.userId || !!findMemberByUserId(group.members, auth.userId)
    
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Not authorized to add members to this group' },
        { status: 403 }
      )
    }

    const userToAdd = await User.findOne({ phone: normalizedPhone })
    if (!userToAdd) {
      return NextResponse.json(
        { message: 'User with this phone number not found' },
        { status: 404 }
      )
    }

    const newMemberName = userToAdd.name
    if (findMemberByUserId(group.members, userToAdd._id.toString())) {
      return NextResponse.json(
        { message: 'User is already a member of this group' },
        { status: 400 }
      )
    }

    // Send notification to group creator
    try {
      const creator = await User.findById(group.createdBy)
      if (creator && creator.fcmToken) {
        await sendPushNotification(
          creator.fcmToken,
          'New Member',
          `${requesterName} added ${newMemberName} to the group ${group.name}`,
          {
            groupId: group._id.toString(),
            groupName: group.name,
            userId: userToAdd._id.toString(),
            userName: newMemberName,
          }
        )
      }
    } catch (error) {
      console.error('Error sending FCM notification:', error)
    }

    addOrClaimMember(group.members, { id: userToAdd._id.toString(), name: newMemberName })
    await group.save()

    return NextResponse.json({
      success: true,
      message: 'Member added to the group successfully',
      data: {
        id: group._id,
        name: group.name,
        description: group.description,
        members: group.members.map((member) => ({ id: member.id, name: member.name, userId: member.userId })),
        emoji: group.emoji,
        inviteCode: group.inviteCode,
      },
    })
  } catch (error) {
    console.error('Add member by phone error:', error)
    return NextResponse.json(
      { message: 'Server error while adding member' },
      { status: 500 }
    )
  }
}
