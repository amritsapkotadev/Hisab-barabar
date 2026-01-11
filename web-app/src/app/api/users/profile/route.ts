import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { authenticateUser } from '@/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()
    const user = await User.findById(auth.userId).select('-password')
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        picture: user.picture,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
        budget: user.budget,
      },
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { message: 'Server error while fetching profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    await connectDB()
    const { name, email, phone } = await request.json()

    // Validate input
    if (!name || !email || !phone) {
      return NextResponse.json(
        { message: 'Name, email, and phone are required' },
        { status: 400 }
      )
    }

    // Check if email is taken by another user
    const emailTaken = await User.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: auth.userId },
    })
    
    if (emailTaken) {
      return NextResponse.json(
        { message: 'Email is already taken by another user' },
        { status: 400 }
      )
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      auth.userId,
      {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
      },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Update user profile error:', error)
    return NextResponse.json(
      { message: 'Server error while updating profile' },
      { status: 500 }
    )
  }
}
