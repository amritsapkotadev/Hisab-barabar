import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Group from '@/models/Group'
import { authenticateUser } from '@/middleware/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()
    const { memberId, memberName } = await request.json()

    if ((!memberId || !memberId.trim()) && (!memberName || !memberName.trim())) {
      return NextResponse.json(
        { message: 'Member id is required' },
        { status: 400 }
      )
    }

    const group = await Group.findById(params.groupId)
    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 })
    }

    if (group.createdBy.toString() !== auth.userId) {
      return NextResponse.json(
        { message: 'Only the group creator can remove members' },
        { status: 403 }
      )
    }

    const member = memberId
      ? group.members.find((m) => m.id === memberId)
      : group.members.find((m) => m.name === memberName)

    if (!member) {
      return NextResponse.json(
        { message: 'Member not found in this group' },
        { status: 404 }
      )
    }

    if (member.userId && member.userId.toString() === group.createdBy.toString()) {
      return NextResponse.json(
        { message: 'The group creator cannot be removed' },
        { status: 400 }
      )
    }

    group.members = group.members.filter((m) => m.id !== member.id)
    await group.save()

    return NextResponse.json({
      success: true,
      message: `${member.name} removed from the group`,
    })
  } catch (error) {
    console.error('Remove group member error:', error)
    return NextResponse.json(
      { message: 'Server error while removing member' },
      { status: 500 }
    )
  }
}
