import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { authenticateUser } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()
    const { budget } = await request.json()

    // Validate budget
    if (budget === undefined || budget < 0) {
      return NextResponse.json(
        { message: 'Budget must be a non-negative number' },
        { status: 400 }
      )
    }

    // Update user's budget
    const user = await User.findByIdAndUpdate(
      auth.userId,
      { budget: budget },
      { new: true, runValidators: true }
    )

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        budget: user.budget,
      },
      message: 'Budget updated successfully',
    })
  } catch (error) {
    console.error('Set budget error:', error)
    return NextResponse.json(
      { message: 'Server error while setting budget' },
      { status: 500 }
    )
  }
}
