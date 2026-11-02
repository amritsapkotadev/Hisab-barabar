import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { generateToken } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { email, otp, purpose } = await request.json()
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : ''
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 400 }
      )
    }

    if (user.isVerified && purpose !== 'reset') {
      return NextResponse.json(
        { message: 'User already verified' },
        { status: 400 }
      )
    }

    if (
      !user.otp ||
      user.otp !== String(otp || '').trim() ||
      !user.otpExpires ||
      user.otpExpires < new Date()
    ) {
      return NextResponse.json(
        { message: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    if (purpose === 'reset') {
      // Do not consume the OTP here; reset-password verifies and clears it.
      return NextResponse.json({
        success: true,
        message: 'OTP verified. You can now set a new password.',
      })
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
