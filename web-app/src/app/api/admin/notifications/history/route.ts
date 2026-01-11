import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Notification from '@/models/Notification'
import { authenticateAdmin } from '@/middleware/adminAuth'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request)
    
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    let query: any = {}
    
    if (status && status !== 'all') {
      query.status = status
    }

    const skip = (page - 1) * limit

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('createdBy', 'name email')
        .populate('recipients.userIds', 'name email picture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query)
    ])

    return NextResponse.json({
      success: true,
      notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching notification history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification history', details: error.message },
      { status: 500 }
    )
  }
}
