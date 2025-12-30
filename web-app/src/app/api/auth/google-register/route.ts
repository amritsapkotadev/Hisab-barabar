import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { generateToken } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { googleId, email, name, picture, phone } = await request.json()

    // Validation
    if (!googleId || !email || !name || !phone) {
      return NextResponse.json(
        { message: 'Google ID, email, name, and phone are required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const userExists = await User.findOne({
      $or: [
        { googleId: googleId },
        { email: email.toLowerCase().trim() },
        { phone: phone.trim() }
      ],
    })

    if (userExists) {
      return NextResponse.json(
        { message: 'User already exists with this email, phone, or Google account' },
        { status: 400 }
      )
    }

    // Create user with Google data
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      googleId: googleId,
      picture: picture,
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
