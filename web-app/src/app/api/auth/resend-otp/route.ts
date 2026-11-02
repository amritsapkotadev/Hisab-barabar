import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { sendOTPEmail } from '@/lib/email'

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { email } = await request.json()
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : ''
    const user = await User.findOne({ email: normalizedEmail })

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

    const otp = generateOTP()
    user.otp = otp
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()

    await sendOTPEmail(email, otp)

    return NextResponse.json({
      success: true,
      message: 'OTP resent successfully.',
    })
  } catch (error) {
    console.error('Resend OTP error:', error)
    return NextResponse.json(
      { message: 'Error resending OTP' },
      { status: 500 }
    )
  }
}
