import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Admin from '@/models/Admin'
import bcrypt from 'bcryptjs'

/**
 * Create the first super-admin account
 * This endpoint should be disabled after initial setup or protected with a setup key
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, password, setupKey } = await request.json()

    // Setup key protection - change this in production!
    const SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'change-this-in-production'
    
    if (setupKey !== SETUP_KEY) {
      return NextResponse.json(
        { error: 'Invalid setup key' },
        { status: 403 }
      )
    }

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if any admin exists
    const existingAdminCount = await Admin.countDocuments()
    
    if (existingAdminCount > 0) {
      return NextResponse.json(
        { error: 'Admin setup has already been completed. Use admin panel to create additional admins.' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() })
    
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create super-admin
    const admin = await Admin.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'super-admin',
      isActive: true,
      permissions: {
        canSendNotifications: true,
        canManageUsers: true,
        canManageAdmins: true,
        canViewAnalytics: true,
        canExportData: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Super-admin account created successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Admin setup error:', error)
    return NextResponse.json(
      { error: 'Failed to create admin account', details: error.message },
      { status: 500 }
    )
  }
}
