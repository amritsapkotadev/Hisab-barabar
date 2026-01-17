import mongoose, { Schema, Document, Model } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

export interface IGroup extends Document {
  name: string
  description: string
  createdBy: mongoose.Types.ObjectId
  members: string[]
  inviteCode: string
  emoji: string
   settled?: boolean
  settledAt?: Date | null
  settlementNotes?: Array<{ note: string; date: Date }>
  totalExpenses?: number
  createdAt: Date
  updatedAt: Date
}

const groupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    inviteCode: {
      type: String,
      unique: true,
      required: true,
      default: () => uuidv4().slice(0, 8).toUpperCase(),
    },
    emoji: {
      type: String,
      trim: true,
      default: '',
    },
    // Settlement-related fields
    settlements: {
      type: [Object],
      default: [],
    },
    balances: {
      type: Object,
      default: {},
    },
    settled: {
      type: Boolean,
      default: false,
    },
    settledAt: {
      type: Date,
      default: null,
    },
    settlementNotes: {
      type: [
        {
          note: { type: String },
          date: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    totalExpenses: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

groupSchema.index({ createdBy: 1, createdAt: -1 })

const Group: Model<IGroup> = mongoose.models.Group || mongoose.model<IGroup>('Group', groupSchema)

export default Group
