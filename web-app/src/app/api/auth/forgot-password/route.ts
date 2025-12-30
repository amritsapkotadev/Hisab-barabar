import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { sendPasswordResetEmail } from '@/lib/email'

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { email } = await request.json()

    // Validate email
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 400 }
      )
    }

    // Generate OTP
    const otp = generateOTP()
    user.otp = otp
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()

    // Send OTP email
    await sendPasswordResetEmail(email, otp)

    return NextResponse.json({
      success: true,
      message: 'OTP sent to email for password reset',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { message: 'Error sending forgot password email' },
      { status: 500 }
    )
  }
}
