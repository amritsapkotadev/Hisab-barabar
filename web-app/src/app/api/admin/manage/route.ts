import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Admin from '@/models/Admin'
import bcrypt from 'bcryptjs'
import { authenticateAdmin, checkPermission } from '@/middleware/adminAuth'

// GET - List all admins (super-admin only)
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request)
    
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    // Check permission
    if (!checkPermission(auth.admin, 'canManageAdmins')) {
      return NextResponse.json(
        { error: 'You do not have permission to manage admins' },
        { status: 403 }
      )
    }

    await connectDB()

    const admins = await Admin.find()
      .select('-password')
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      admins,
      total: admins.length,
    })
  } catch (error: any) {
    console.error('Error fetching admins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admins', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new admin (super-admin only)
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
    if (!checkPermission(auth.admin, 'canManageAdmins')) {
      return NextResponse.json(
        { error: 'You do not have permission to create admins' },
        { status: 403 }
      )
    }

    const { name, email, password, phone, role, permissions } = await request.json()

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

    // Only super-admin can create other super-admins
    if (role === 'super-admin' && auth.admin.role !== 'super-admin') {
      return NextResponse.json(
        { error: 'Only super-admin can create super-admin accounts' },
        { status: 403 }
      )
    }

    await connectDB()

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

    // Create admin
    const newAdmin = await Admin.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role: role || 'admin',
      permissions: permissions || {
        canSendNotifications: true,
        canManageUsers: true,
        canManageAdmins: false,
        canViewAnalytics: true,
        canExportData: true,
      },
      createdBy: auth.admin._id,
    })

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        permissions: newAdmin.permissions,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { error: 'Failed to create admin', details: error.message },
      { status: 500 }
    )
  }
}
