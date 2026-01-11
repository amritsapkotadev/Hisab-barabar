import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Notification from '@/models/Notification'
import { authenticateAdmin, checkPermission } from '@/middleware/adminAuth'

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

    const { title, body, userIds, sendToAll, data, scheduledFor } = await request.json()

    // Validation
    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      )
    }

    if (!scheduledFor) {
      return NextResponse.json(
        { error: 'Scheduled time is required' },
        { status: 400 }
      )
    }

    const scheduledDate = new Date(scheduledFor)
    
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    await connectDB()

    // Create scheduled notification
    const notification = await Notification.create({
      title,
      body,
      data: data || {},
      recipients: {
        type: sendToAll ? 'all' : 'selected',
        userIds: sendToAll ? [] : userIds || []
      },
      status: 'scheduled',
      scheduledFor: scheduledDate,
      createdBy: auth.admin._id,
    })

    return NextResponse.json({
      success: true,
      message: 'Notification scheduled successfully',
      notification: {
        id: notification._id,
        title: notification.title,
        scheduledFor: notification.scheduledFor,
        status: notification.status,
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error scheduling notification:', error)
    return NextResponse.json(
      { error: 'Failed to schedule notification', details: error.message },
      { status: 500 }
    )
  }
}
