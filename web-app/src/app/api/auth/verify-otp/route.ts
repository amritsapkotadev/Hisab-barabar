import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { generateToken } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { email, otp } = await request.json()
    const user = await User.findOne({ email })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 400 }
      )
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: 'User already verified' },
        { status: 400 }
      )
    }

    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return NextResponse.json(
        { message: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    user.isVerified = true
    user.otp = undefined
    user.otpExpires = undefined
    await user.save()

    // Generate JWT token
    const token = generateToken(user._id.toString())

    return NextResponse.json({
      success: true,
      token,
      message: 'Email verified successfully. You can now log in.',
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { success: false, message: 'Error verifying OTP' },
      { status: 500 }
    )
  }
}
