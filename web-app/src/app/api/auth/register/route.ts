import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { sendOTPEmail } from '@/lib/email'

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { name, email, password, phone, fcmToken } = await request.json()

    // Validation
    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if user exists
    const userExists = await User.findOne({ 
      $or: [
        { email: email.toLowerCase().trim() },
        { phone: phone.trim() }
      ]
    })
    
    if (userExists) {
      return NextResponse.json(
        { message: 'User already exists with this email or phone' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    const otp = generateOTP()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000)

    if (fcmToken) {
      await User.updateMany({ fcmToken }, { $unset: { fcmToken: 1 } })
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      fcmToken: fcmToken || undefined,
      otp: otp,
      otpExpires: otpExpires,
      isVerified: false,
    })

    // Send OTP email
    await sendOTPEmail(email, otp)

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        message: 'User registered successfully. Please verify your email with the OTP sent.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register user error:', error)
    return NextResponse.json(
      { message: 'Server error during registration' },
      { status: 500 }
    )
  }
}
