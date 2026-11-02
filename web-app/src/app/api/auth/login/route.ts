import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { generateToken } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { email, password, fcmToken } = await request.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 400 }
      )
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password || '')
    if (!isMatch) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 400 }
      )
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { success: false, message: 'Email not verified' },
        { status: 400 }
      )
    }

    // Update FCM token if provided. The token is unique, so release it from
    // any previous account first.
    if (fcmToken) {
      await User.updateMany(
        { fcmToken, _id: { $ne: user._id } },
        { $unset: { fcmToken: 1 } }
      )
      user.fcmToken = fcmToken
      await user.save()
    }

    // Generate token
    const token = generateToken(user._id.toString())

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        picture: user.picture,
        budget: user.budget,
      },
      message: 'Login successful',
    })
  } catch (error) {
    console.error('Login user error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error during login' },
      { status: 500 }
    )
  }
}
