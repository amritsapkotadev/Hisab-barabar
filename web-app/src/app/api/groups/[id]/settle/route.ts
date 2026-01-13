import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request, { params }) {
  const { id } = params;
  const groupId = ObjectId.isValid(id) ? new ObjectId(id) : id;
  const { settlements } = await request.json(); // Expecting array of settlements

  try {
    const db = await connectToDatabase();
    const groups = db.collection('groups');

    // Update the group's settlements and mark as settled
    const result = await groups.updateOne(
      { _id: groupId },
      {
        $set: {
          settlements: settlements,
          settled: true,
        },
      }
    );

    if (result.modifiedCount === 1) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Group not found or not updated.' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
