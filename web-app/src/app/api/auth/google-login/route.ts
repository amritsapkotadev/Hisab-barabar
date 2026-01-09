import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { generateToken } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { googleId, email, name, picture } = await request.json()

    // Validation
    if (!googleId || !email || !name) {
      return NextResponse.json(
        { message: 'Google ID, email, and name are required' },
        { status: 400 }
      )
    }

    // Find user by Google ID or email
    let user = await User.findOne({
      $or: [{ googleId: googleId }, { email: email.toLowerCase().trim() }],
    })

    if (!user) {
      // Auto-create user if they don't exist (unified sign-in/sign-up)
      const userPhone = `google_${googleId}_${Date.now()}`
      
      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: userPhone,
        googleId: googleId,
        picture: picture,
        isVerified: true, // Google users are auto-verified
      })

      console.log('Created new user via Google login:', user.email)
    } else {
      // Update Google ID and picture if not set
      let updated = false
      if (!user.googleId) {
        user.googleId = googleId
        updated = true
      }
      if (picture && user.picture !== picture) {
        user.picture = picture
        updated = true
      }
      if (updated) {
        await user.save()
      }
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
      message: 'Google login successful',
    })
  } catch (error) {
    console.error('Google login error:', error)
    return NextResponse.json(
      { message: 'Server error during Google login' },
      { status: 500 }
    )
  }
}
