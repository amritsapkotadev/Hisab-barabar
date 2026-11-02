import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Group from '@/models/Group'
import { authenticateUser } from '@/middleware/auth'
import { findMemberByUserId } from '@/utils/groupMembers'

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

    const hasAccess =
      group.createdBy.toString() === auth.userId || !!findMemberByUserId(group.members, auth.userId)

    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Not authorized to view this group' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      inviteCode: group.inviteCode,
    })
  } catch (error) {
    console.error('Get group invite details error:', error)
    return NextResponse.json(
      { message: 'Server error while fetching invite details' },
      { status: 500 }
    )
  }
}
