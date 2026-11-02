import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { generateToken } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { googleId, email, name, picture, fcmToken } = await request.json()

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

      if (fcmToken) {
        await User.updateMany({ fcmToken }, { $unset: { fcmToken: 1 } })
      }

      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: userPhone,
        googleId: googleId,
        picture: picture,
        fcmToken: fcmToken || undefined, // Save FCM token if provided
        isVerified: true, // Google users are auto-verified
      })

      console.log('Created new user via Google login:', user.email)
    } else {
      // Update existing user
      let updated = false
      
      // Update FCM token if new token is provided. The token is unique, so
      // release it from any previous account first.
      if (fcmToken && user.fcmToken !== fcmToken) {
        await User.updateMany(
          { fcmToken, _id: { $ne: user._id } },
          { $unset: { fcmToken: 1 } }
        )
        user.fcmToken = fcmToken
        updated = true
        console.log('Updated FCM token for existing Google user:', user.email)
      }
      
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId
        updated = true
      }
      
      // Update picture if changed
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
