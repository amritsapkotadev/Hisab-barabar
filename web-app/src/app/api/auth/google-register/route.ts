import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { generateToken } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { googleId, email, name, picture, phone, fcmToken } = await request.json()

    // Validation - phone is now optional for Google users
    if (!googleId || !email || !name) {
      return NextResponse.json(
        { message: 'Google ID, email, and name are required' },
        { status: 400 }
      )
    }

    // Check if user exists by googleId or email
    const userExists = await User.findOne({
      $or: [
        { googleId: googleId },
        { email: email.toLowerCase().trim() },
      ],
    })

    if (userExists) {
      return NextResponse.json(
        { message: 'User already exists with this email or Google account' },
        { status: 400 }
      )
    }

    // Check if phone is provided and already in use
    if (phone && phone.trim()) {
      const phoneExists = await User.findOne({ phone: phone.trim() })
      if (phoneExists) {
        return NextResponse.json(
          { message: 'Phone number already in use' },
          { status: 400 }
        )
      }
    }

    // Generate a unique phone placeholder if not provided
    const userPhone = phone && phone.trim() ? phone.trim() : `google_${googleId}_${Date.now()}`

    if (fcmToken) {
      await User.updateMany({ fcmToken }, { $unset: { fcmToken: 1 } })
    }

    // Create user with Google data
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: userPhone,
      googleId: googleId,
      picture: picture,
      fcmToken: fcmToken || undefined, // Save FCM token if provided
      isVerified: true, // Google users are auto-verified
    })

    // Generate JWT token
    const token = generateToken(user._id.toString())

    return NextResponse.json(
      {
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
        message: 'Google registration successful',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Google register error:', error)
    return NextResponse.json(
      { message: 'Server error during Google registration' },
      { status: 500 }
    )
  }
}
