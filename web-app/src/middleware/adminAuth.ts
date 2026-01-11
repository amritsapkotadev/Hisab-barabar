import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import Admin from '@/models/Admin'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function authenticateAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No authorization token provided', status: 401 }
    }

    const token = authHeader.substring(7)

    // Verify JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return { error: 'Invalid or expired token', status: 401 }
    }

    // Check if it's an admin token (has adminId)
    if (!decoded.adminId) {
      return { error: 'Invalid admin token', status: 401 }
    }

    await connectDB()

    // Fetch admin from database
    const admin = await Admin.findById(decoded.adminId).select('-password')

    if (!admin) {
      return { error: 'Admin not found', status: 404 }
    }

    // Check if admin is active
    if (!admin.isActive) {
      return { error: 'Admin account is deactivated', status: 403 }
    }

    // Check if account is locked
    if (admin.isLocked && admin.isLocked()) {
      return { 
        error: 'Account is temporarily locked due to multiple failed login attempts', 
        status: 403 
      }
    }

    return { admin }
  } catch (error: any) {
    console.error('Admin authentication error:', error)
    return { error: 'Authentication failed', status: 500 }
  }
}

// Check specific permission
export function checkPermission(admin: any, permission: keyof typeof admin.permissions) {
  if (admin.role === 'super-admin') {
    return true // Super-admin has all permissions
  }
  return admin.permissions[permission] === true
}
