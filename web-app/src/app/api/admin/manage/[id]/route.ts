import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Admin from '@/models/Admin'
import { authenticateAdmin, checkPermission } from '@/middleware/adminAuth'

// PATCH - Update admin (super-admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { isActive, role, permissions } = await request.json()

    await connectDB()

    const adminToUpdate = await Admin.findById(params.id)

    if (!adminToUpdate) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Prevent super-admin from deactivating themselves
    if (adminToUpdate._id.toString() === auth.admin._id.toString() && isActive === false) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 400 }
      )
    }

    // Update fields
    if (isActive !== undefined) adminToUpdate.isActive = isActive
    if (role) {
      // Only super-admin can change roles to super-admin
      if (role === 'super-admin' && auth.admin.role !== 'super-admin') {
        return NextResponse.json(
          { error: 'Only super-admin can grant super-admin role' },
          { status: 403 }
        )
      }
      adminToUpdate.role = role
    }
    if (permissions) adminToUpdate.permissions = permissions

    await adminToUpdate.save()

    return NextResponse.json({
      success: true,
      message: 'Admin updated successfully',
      admin: {
        id: adminToUpdate._id,
        name: adminToUpdate.name,
        email: adminToUpdate.email,
        role: adminToUpdate.role,
        permissions: adminToUpdate.permissions,
        isActive: adminToUpdate.isActive,
      },
    })
  } catch (error: any) {
    console.error('Error updating admin:', error)
    return NextResponse.json(
      { error: 'Failed to update admin', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete admin (super-admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'You do not have permission to delete admins' },
        { status: 403 }
      )
    }

    await connectDB()

    const adminToDelete = await Admin.findById(params.id)

    if (!adminToDelete) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Prevent deleting yourself
    if (adminToDelete._id.toString() === auth.admin._id.toString()) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    // Prevent deleting the last super-admin
    if (adminToDelete.role === 'super-admin') {
      const superAdminCount = await Admin.countDocuments({ role: 'super-admin' })
      if (superAdminCount === 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last super-admin account' },
          { status: 400 }
        )
      }
    }

    await Admin.findByIdAndDelete(params.id)

    return NextResponse.json({
      success: true,
      message: 'Admin deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting admin:', error)
    return NextResponse.json(
      { error: 'Failed to delete admin', details: error.message },
      { status: 500 }
    )
  }
}
