import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Settlement from '@/models/Settlement';
import type { NextRequest } from 'next/server';

// GET /api/settlements?groupId=xxx
export async function GET(request: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');

  if (!groupId) {
    return NextResponse.json({ success: false, error: 'groupId is required' }, { status: 400 });
  }

  try {
    const settlements = await Settlement.find({ groupId }).sort({ date: -1 }).lean();
    return NextResponse.json({ success: true, settlements });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
