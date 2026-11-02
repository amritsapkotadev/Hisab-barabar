import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { email, otp, newPassword } = await request.json()

    // Validate input
    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { message: 'Email, OTP, and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'New password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or OTP' },
        { status: 400 }
      )
    }

    // The reset OTP must have been issued by forgot-password and still be valid
    if (
      !user.otp ||
      user.otp !== String(otp).trim() ||
      !user.otpExpires ||
      user.otpExpires < new Date()
    ) {
      return NextResponse.json(
        { message: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password and clear OTP
    user.password = hashedPassword
    user.otp = undefined
    user.otpExpires = undefined
    user.isVerified = true
    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Password reset successful. You can now log in.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { message: 'Error resetting password' },
      { status: 500 }
    )
  }
}
