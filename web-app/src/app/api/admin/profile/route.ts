import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Admin from '@/models/Admin'
import bcrypt from 'bcryptjs'
import { authenticateAdmin } from '@/middleware/adminAuth'

// GET - Fetch admin profile
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request)
    
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: auth.admin._id,
        name: auth.admin.name,
        email: auth.admin.email,
        phone: auth.admin.phone,
        role: auth.admin.role,
        permissions: auth.admin.permissions,
        picture: auth.admin.picture,
        lastLogin: auth.admin.lastLogin,
        isActive: auth.admin.isActive,
        createdAt: auth.admin.createdAt,
      },
    })
  } catch (error: any) {
    console.error('Error fetching admin profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Update admin profile
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request)
    
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const { name, phone, picture, currentPassword, newPassword } = await request.json()

    await connectDB()

    const admin = await Admin.findById(auth.admin._id)

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Update basic fields
    if (name) admin.name = name
    if (phone !== undefined) admin.phone = phone
    if (picture !== undefined) admin.picture = picture

    // Change password if provided
    if (currentPassword && newPassword) {
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, admin.password)
      
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        )
      }

      // Validate new password
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'New password must be at least 8 characters' },
          { status: 400 }
        )
      }

      // Hash and update password
      admin.password = await bcrypt.hash(newPassword, 10)
    }

    await admin.save()

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        picture: admin.picture,
      },
    })
  } catch (error: any) {
    console.error('Error updating admin profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile', details: error.message },
      { status: 500 }
    )
  }
}
