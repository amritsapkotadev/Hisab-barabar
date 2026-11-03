import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { authenticateUser } from '@/middleware/auth'

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateUser(request)
    
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const body: unknown = await request.json()
    if (typeof body !== 'object' || body === null || !('fcmToken' in body)) {
      return NextResponse.json(
        { error: 'FCM token is required' },
        { status: 400 }
      )
    }
    const { fcmToken } = body as { fcmToken: unknown }

    if (fcmToken === null) {
      await connectDB()
      const user = await User.findByIdAndUpdate(
        auth.user._id,
        { $unset: { fcmToken: 1 } },
        { new: true }
      )
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        message: 'Push notifications disabled successfully'
      })
    }

    if (typeof fcmToken !== 'string' || !fcmToken.trim()) {
      return NextResponse.json(
        { error: 'FCM token is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // A device token belongs to exactly one account; release it from any
    // previous owner before assigning it (avoids E11000 on the unique index).
    await User.updateMany(
      { fcmToken, _id: { $ne: auth.user._id } },
      { $unset: { fcmToken: 1 } }
    )

    const user = await User.findByIdAndUpdate(
      auth.user._id,
      { fcmToken: fcmToken },
      { new: true }
    )

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log(`FCM token updated for user: ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'FCM token updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating FCM token:', error)
    return NextResponse.json(
      { error: 'Failed to update FCM token', details: error.message },
      { status: 500 }
    )
  }
}
