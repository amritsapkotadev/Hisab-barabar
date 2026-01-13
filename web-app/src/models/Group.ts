import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ISettlement extends Document {
  fromUserId: string;
  toUserId: string;
  amount: number;
  date: Date;
  description?: string;
}

export interface IGroup extends Document {
  name: string;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  members: string[];
  inviteCode: string;
  emoji: string;
  
  // Balances and settlements
  balances: Map<string, number>;
  settlements: ISettlement[];
  settled: boolean;
  settledAt?: Date;
  totalExpenses: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const settlementSchema = new Schema<ISettlement>(
  {
    fromUserId: {
      type: String,
      required: true,
      trim: true,
    },
    toUserId: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

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
    
    // balances and settlements
    balances: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    settlements: [settlementSchema],
    settled: {
      type: Boolean,
      default: false,
    },
    settledAt: {
      type: Date,
    },
    totalExpenses: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
groupSchema.index({ createdBy: 1, createdAt: -1 });
groupSchema.index({ 'settlements.fromUserId': 1 });
groupSchema.index({ 'settlements.toUserId': 1 });
groupSchema.index({ settled: 1 });

 groupSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

const Group: Model<IGroup> = mongoose.models.Group || mongoose.model<IGroup>('Group', groupSchema);

export default Group;