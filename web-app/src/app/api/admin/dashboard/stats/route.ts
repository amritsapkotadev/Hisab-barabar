import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Group from '@/models/Group'
import Expense from '@/models/Expense'
import { authenticateAdmin } from '@/middleware/adminAuth'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request)
    
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    await connectDB()

    // Fetch all statistics in parallel
    const [
      totalUsers,
      verifiedUsers,
      usersWithTokens,
      admins,
      totalGroups,
      totalExpenses,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ fcmToken: { $exists: true, $ne: null } }),
      User.countDocuments({ isAdmin: true }),
      Group.countDocuments(),
      Expense.countDocuments(),
      User.find()
        .select('name email picture fcmToken isVerified createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
    ])

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        verifiedUsers,
        usersWithTokens,
        admins,
        totalGroups,
        totalExpenses,
        recentUsers
      }
    })
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: error.message },
      { status: 500 }
    )
  }
}
