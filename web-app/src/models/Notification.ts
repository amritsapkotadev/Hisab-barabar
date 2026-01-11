import mongoose, { Document, Schema } from 'mongoose'

export interface INotification extends Document {
  title: string
  body: string
  data?: Record<string, string>
  recipients: {
    type: 'all' | 'selected'
    userIds?: mongoose.Types.ObjectId[]
  }
  status: 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled'
  scheduledFor?: Date
  sentAt?: Date
  results?: {
    totalUsers: number
    successCount: number
    failedCount: number
    errors: Array<{
      userId: mongoose.Types.ObjectId
      email: string
      error: string
    }>
  }
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
      maxlength: [500, 'Body cannot exceed 500 characters'],
    },
    data: {
      type: Schema.Types.Mixed,
    },
    recipients: {
      type: {
        type: String,
        enum: ['all', 'selected'],
        required: true,
      },
      userIds: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
    },
    status: {
      type: String,
      enum: ['scheduled', 'sending', 'sent', 'failed', 'cancelled'],
      default: 'scheduled',
    },
    scheduledFor: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    results: {
      totalUsers: Number,
      successCount: Number,
      failedCount: Number,
      errors: [{
        userId: Schema.Types.ObjectId,
        email: String,
        error: String,
      }],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient queries
NotificationSchema.index({ status: 1, scheduledFor: 1 })
NotificationSchema.index({ createdBy: 1, createdAt: -1 })
NotificationSchema.index({ createdAt: -1 })

const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)

export default Notification
