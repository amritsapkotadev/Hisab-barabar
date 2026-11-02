import mongoose, { Schema, Document, Model } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import User from './User';

// A group member is identified by a stable, group-scoped `id` that never
// changes and never collides — even if two members share the same display
// `name` (e.g. two ghost/placeholder contacts, or two real accounts with
// identical names). `userId` links the entry to a real registered account
// when one exists; it's omitted for ghost members who haven't signed up yet.
export interface IGroupMember {
  id: string
  name: string
  userId?: mongoose.Types.ObjectId
}

export interface IGroup extends Document {
  name: string
  description: string
  createdBy: mongoose.Types.ObjectId
  members: IGroupMember[]
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
  balances?: Record<string, number>;
  settled?: boolean;
  settledAt?: Date | null;
  settlementNotes?: Array<{ note: string; date: Date }>;
  totalExpenses?: number;
}

const groupMemberSchema = new Schema<IGroupMember>(
  {
    id: { type: String, required: true, default: () => uuidv4() },
    name: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
)

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
      type: [groupMemberSchema],
      required: true,
      validate: {
        validator: (members: IGroupMember[]) => Array.isArray(members) && members.length > 0,
        message: 'At least one member is required',
      },
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
