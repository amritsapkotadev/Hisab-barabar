import mongoose, { Schema, Document, Model } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import User from './User';

export interface IGroup extends Document {
  name: string
  description: string
  createdBy: mongoose.Types.ObjectId
    members: mongoose.Types.ObjectId[]
  inviteCode: string
  emoji: string
  createdAt: Date
  updatedAt: Date
  netSettlements?: Array<{
    fromUserId: string;
    toUserId: string;
    amount: number;
  }>;
  settlements?: any[];
    balances?: Record<string, number>; // keys will be userId strings
  settled?: boolean;
  settledAt?: Date | null;
  settlementNotes?: Array<{ note: string; date: Date }>;
  totalExpenses?: number;
}

const groupSchema = new Schema<IGroup>(
  {
        netSettlements: [
          {
            fromUserId: { type: String, required: true },
            toUserId: { type: String, required: true },
            amount: { type: Number, required: true }
          }
        ],
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
      members: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        required: true,
      },
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
        default: {}, // keys will be userId strings
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
