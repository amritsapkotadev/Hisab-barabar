import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Settlement from '@/models/Settlement';
import Group from '@/models/Group';
import type { NextRequest } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import { findMemberByUserId } from '@/utils/groupMembers';

// GET /api/settlements?groupId=xxx
export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request);
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');

  if (!groupId) {
    return NextResponse.json({ success: false, error: 'groupId is required' }, { status: 400 });
  }

  try {
    const group = await Group.findById(groupId).select('createdBy members').lean();
    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    const hasAccess =
      group.createdBy.toString() === auth.userId ||
      !!findMemberByUserId(group.members, auth.userId);
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Not authorized to view this group' }, { status: 403 });
    }

    const settlements = await Settlement.find({ groupId }).sort({ date: -1 }).lean();
    return NextResponse.json({ success: true, settlements });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
