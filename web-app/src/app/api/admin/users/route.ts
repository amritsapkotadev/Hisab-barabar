import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
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

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const hasToken = searchParams.get('hasToken')
    
    let query: any = {}
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Filter by FCM token presence
    if (hasToken === 'true') {
      query.fcmToken = { $exists: true, $ne: null }
    } else if (hasToken === 'false') {
      query.$or = [
        { fcmToken: { $exists: false } },
        { fcmToken: null }
      ]
    }

    const users = await User.find(query)
      .select('name email phone isVerified fcmToken picture createdAt')
      .sort({ createdAt: -1 })
      .limit(1000)

    return NextResponse.json({
      success: true,
      users,
      total: users.length
    })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    )
  }
}
