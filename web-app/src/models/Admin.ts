import mongoose, { Document, Schema } from 'mongoose'

export interface IAdmin extends Document {
  name: string
  email: string
  password: string
  phone?: string
  role: 'super-admin' | 'admin' | 'moderator'
  isActive: boolean
  permissions: {
    canSendNotifications: boolean
    canManageUsers: boolean
    canManageAdmins: boolean
    canViewAnalytics: boolean
    canExportData: boolean
  }
  lastLogin?: Date
  loginAttempts: number
  lockoutUntil?: Date
  picture?: string
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['super-admin', 'admin', 'moderator'],
      default: 'admin',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    permissions: {
      canSendNotifications: {
        type: Boolean,
        default: true,
      },
      canManageUsers: {
        type: Boolean,
        default: true,
      },
      canManageAdmins: {
        type: Boolean,
        default: false,
      },
      canViewAnalytics: {
        type: Boolean,
        default: true,
      },
      canExportData: {
        type: Boolean,
        default: true,
      },
    },
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: {
      type: Date,
    },
    picture: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster queries (email index is already defined in schema with unique: true)
AdminSchema.index({ isActive: 1 })
AdminSchema.index({ role: 1 })

// Method to check if account is locked
AdminSchema.methods.isLocked = function (): boolean {
  return !!(this.lockoutUntil && this.lockoutUntil > new Date())
}

// Method to increment login attempts
AdminSchema.methods.incLoginAttempts = async function (): Promise<IAdmin> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockoutUntil && this.lockoutUntil < new Date()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockoutUntil: 1 },
    })
  }

  // Otherwise, increment
  const updates: any = { $inc: { loginAttempts: 1 } }

  // Lock the account for 2 hours after 5 failed attempts
  const MAX_LOGIN_ATTEMPTS = 5
  const LOCK_TIME = 2 * 60 * 60 * 1000 // 2 hours

  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.lockoutUntil) {
    updates.$set = { lockoutUntil: new Date(Date.now() + LOCK_TIME) }
  }

  return await this.updateOne(updates)
}

// Method to reset login attempts
AdminSchema.methods.resetLoginAttempts = async function (): Promise<IAdmin> {
  return await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockoutUntil: 1 },
  })
}

const Admin = mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema)

export default Admin
