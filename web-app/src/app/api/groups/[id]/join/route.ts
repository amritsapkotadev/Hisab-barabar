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
    const userName = auth.user.name

    if (!params.id) {
      return NextResponse.json({ message: 'Group ID is required' }, { status: 400 })
    }

    // Find group by ID
    const group = await Group.findById(params.id)

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 })
    }

    // Check if user is already a member
    if (findMemberByUserId(group.members, auth.userId)) {
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
        message: 'You are already a member of this group',
      })
    }

    // Add (or claim an existing ghost entry for) this user
    addOrClaimMember(group.members, { id: auth.userId, name: userName })
    await group.save()

    // Send notification to group creator
    try {
      const creator = await User.findById(group.createdBy)
      if (creator && creator.fcmToken) {
        await sendPushNotification(
          creator.fcmToken,
          'New Member Joined',
          `${userName} has joined the group ${group.name}`,
          {
            groupId: group._id.toString(),
            groupName: group.name,
            userId: auth.userId,
            userName: userName,
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
    console.error('Join group by ID error:', error)
    return NextResponse.json(
      { message: 'Server error while joining group' },
      { status: 500 }
    )
  }
}
