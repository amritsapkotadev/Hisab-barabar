import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Notification from '@/models/Notification'
import { authenticateAdmin, checkPermission } from '@/middleware/adminAuth'
import { sendPushNotification } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request)
    
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    // Check permission
    if (!checkPermission(auth.admin, 'canSendNotifications')) {
      return NextResponse.json(
        { error: 'You do not have permission to send notifications' },
        { status: 403 }
      )
    }

    const { title, body, userIds, sendToAll, data } = await request.json()

    // Validation
    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      )
    }

    await connectDB()

    let users
    if (sendToAll) {
      // Send to all users with FCM tokens
      users = await User.find({
        fcmToken: { $exists: true, $ne: null }
      }).select('name email fcmToken picture')
    } else if (userIds && userIds.length > 0) {
      // Send to specific users
      users = await User.find({
        _id: { $in: userIds },
        fcmToken: { $exists: true, $ne: null }
      }).select('name email fcmToken picture')
    } else {
      return NextResponse.json(
        { error: 'Please select users or choose to send to all' },
        { status: 400 }
      )
    }

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users with FCM tokens found' },
        { status: 404 }
      )
    }

    // Create notification record
    const notification = await Notification.create({
      title,
      body,
      data: data || {},
      recipients: {
        type: sendToAll ? 'all' : 'selected',
        userIds: sendToAll ? [] : userIds || []
      },
      status: 'sending',
      createdBy: auth.admin._id,
    })

    // Send notifications
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    }

    await Promise.allSettled(
      users.map(async (user) => {
        try {
          await sendPushNotification(
            user.fcmToken!,
            title,
            body,
            data || {}
          )
          results.success++
        } catch (error: any) {
          results.failed++
          results.errors.push({
            userId: user._id,
            email: user.email,
            error: error.message
          })
        }
      })
    )

    // Update notification record with results
    notification.status = results.failed === users.length ? 'failed' : 'sent'
    notification.sentAt = new Date()
    notification.results = {
      totalUsers: users.length,
      successCount: results.success,
      failedCount: results.failed,
      errors: results.errors
    }
    await notification.save()

    return NextResponse.json({
      success: true,
      message: 'Notifications sent',
      results: {
        totalUsers: users.length,
        successCount: results.success,
        failedCount: results.failed,
        errors: results.errors
      }
    })
  } catch (error: any) {
    console.error('Error sending notifications:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications', details: error.message },
      { status: 500 }
    )
  }
}
