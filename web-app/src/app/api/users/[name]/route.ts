import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { authenticateUser } from '@/middleware/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()
    const user = await User.findOne({ name: params.name }).select('-password')
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        picture: user.picture || null,
      },
    })
  } catch (error) {
    console.error('Get user by name error:', error)
    return NextResponse.json(
      { message: 'Server error while fetching user' },
      { status: 500 }
    )
  }
}
