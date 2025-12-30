import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'

export interface AuthRequest extends NextRequest {
  userId?: string
  user?: any
}

export async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
    return decoded
  } catch (error) {
    return null
  }
}

export async function authenticateUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No token provided', status: 401 }
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)

    if (!decoded) {
      return { error: 'Invalid token', status: 401 }
    }

    await connectDB()
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return { error: 'User not found', status: 404 }
    }

    return { user, userId: decoded.id }
  } catch (error) {
    console.error('Authentication error:', error)
    return { error: 'Authentication failed', status: 500 }
  }
}

export function generateToken(userId: string) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' })
}
