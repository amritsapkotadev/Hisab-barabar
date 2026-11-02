import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Group from '@/models/Group'
import User from '@/models/User'
import { authenticateUser } from '@/middleware/auth'
import { sendPushNotification } from '@/lib/firebase'
import { addOrClaimMember, findMemberByUserId } from '@/utils/groupMembers'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()
    const { inviteCode } = await request.json()
    const username = auth.user.name

    if (!inviteCode || !inviteCode.trim()) {
      return NextResponse.json(
        { message: 'Invite code is required' },
        { status: 400 }
      )
    }

    // Find group by invite code
    const group = await Group.findOne({ inviteCode: inviteCode.trim().toUpperCase() })

    if (!group) {
      return NextResponse.json({ message: 'Invalid invite code' }, { status: 404 })
    }

    // Check if user is already a member
    if (findMemberByUserId(group.members, auth.userId)) {
      return NextResponse.json(
        { message: 'You are already a member of this group' },
        { status: 400 }
      )
    }

    // Add (or claim an existing ghost entry for) this user
    addOrClaimMember(group.members, { id: auth.userId, name: username })
    await group.save()

    // Send notification to group creator
    try {
      const creator = await User.findById(group.createdBy)
      if (creator && creator.fcmToken) {
        await sendPushNotification(
          creator.fcmToken,
          'New Member Joined',
          `${username} has joined the group ${group.name}`,
          {
            groupId: group._id.toString(),
            groupName: group.name,
            userId: auth.userId,
            userName: username,
          }
        )
      }
    } catch (error) {
      console.error('Error sending FCM notification:', error)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: group._id,
        name: group.name,
        description: group.description,
        members: group.members.map((member) => ({ id: member.id, name: member.name, userId: member.userId })),
        emoji: group.emoji,
        inviteCode: group.inviteCode,
      },
      message: 'Successfully joined group',
    })
  } catch (error) {
    console.error('Join group error:', error)
    return NextResponse.json(
      { message: 'Server error while joining group' },
      { status: 500 }
    )
  }
}
