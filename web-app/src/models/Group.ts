import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ISettlement extends Document {
  _id: mongoose.Types.ObjectId;
  fromUserId: string;
  toUserId: string;
  amount: number;
  date: Date;
  description?: string;
  groupId: mongoose.Types.ObjectId; // Add group reference
  status?: 'pending' | 'completed' | 'cancelled'; // Add status field
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
  settlements: mongoose.Types.ObjectId[]; // Reference to Settlement documents
  settled: boolean;
  settledAt?: Date;
  totalExpenses: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// Settlement Schema (as a separate collection)
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
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true } // Add timestamps to settlements too
);

// Group Schema
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
    settlements: [{
      type: Schema.Types.ObjectId,
      ref: 'Settlement',
    }],
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

// Indexes for Group
groupSchema.index({ createdBy: 1, createdAt: -1 });
groupSchema.index({ settlements: 1 });
groupSchema.index({ settled: 1 });
groupSchema.index({ inviteCode: 1 }, { unique: true });

// Indexes for Settlement
settlementSchema.index({ groupId: 1 });
settlementSchema.index({ fromUserId: 1 });
settlementSchema.index({ toUserId: 1 });
settlementSchema.index({ status: 1 });
settlementSchema.index({ date: -1 });

// Virtuals
groupSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

// Pre-save middleware for Group
groupSchema.pre('save', function (next) {
  // Update settled status if all balances are zero
  const balances = Array.from(this.balances?.values() || []);
  const allSettled = balances.every(balance => Math.abs(balance) < 0.01);
  
  if (allSettled && !this.settled) {
    this.settled = true;
    this.settledAt = new Date();
  } else if (!allSettled && this.settled) {
    this.settled = false;
    this.settledAt = undefined;
  }
  next();
});

// Static method to simplify debts and create settlements
groupSchema.statics.simplifyDebts = async function (groupId: mongoose.Types.ObjectId) {
  const group = await this.findById(groupId).populate('settlements');
  if (!group) throw new Error('Group not found');
  
  // Get current balances
  const balances = new Map(group.balances || new Map());
  
  // Filter out settled balances (≈0)
  const activeBalances = Array.from(balances.entries())
    .filter(([_, amount]) => Math.abs(amount) > 0.01)
    .map(([userId, amount]) => ({ userId, amount }));
  
  // Separate debtors and creditors
  const debtors = activeBalances
    .filter(b => b.amount < 0)
    .map(b => ({ ...b, amount: Math.abs(b.amount) }))
    .sort((a, b) => b.amount - a.amount);
  
  const creditors = activeBalances
    .filter(b => b.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  
  const newSettlements = [];
  let debtorIndex = 0;
  let creditorIndex = 0;
  
  // Greedy algorithm
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    
    if (debtor.userId === creditor.userId) {
      creditorIndex++;
      continue;
    }
    
    const settlementAmount = Number(Math.min(debtor.amount, creditor.amount).toFixed(2));
    
    if (settlementAmount > 0) {
      const settlement = new Settlement({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: settlementAmount,
        groupId: group._id,
        description: `Simplified settlement`,
        status: 'pending'
      });
      
      newSettlements.push(settlement);
      
      // Update local balances
      debtor.amount = Number((debtor.amount - settlementAmount).toFixed(2));
      creditor.amount = Number((creditor.amount - settlementAmount).toFixed(2));
    }
    
    if (debtor.amount < 0.01) debtorIndex++;
    if (creditor.amount < 0.01) creditorIndex++;
  }
  
  // Save new settlements
  const savedSettlements = await Settlement.insertMany(newSettlements);
  
  // Update group with new settlements
  group.settlements.push(...savedSettlements.map(s => s._id));
  await group.save();
  
  return savedSettlements;
};

// Instance method to record a settlement
groupSchema.methods.recordSettlement = async function (
  fromUserId: string,
  toUserId: string,
  amount: number,
  description?: string
) {
  const settlement = new Settlement({
    fromUserId,
    toUserId,
    amount,
    groupId: this._id,
    description,
    status: 'completed'
  });
  
  await settlement.save();
  
  // Update balances
  const fromBalance = this.balances.get(fromUserId) || 0;
  const toBalance = this.balances.get(toUserId) || 0;
  
  this.balances.set(fromUserId, Number((fromBalance + amount).toFixed(2)));
  this.balances.set(toUserId, Number((toBalance - amount).toFixed(2)));
  
  this.settlements.push(settlement._id);
  await this.save();
  
  return settlement;
};

// Create models
const Settlement: Model<ISettlement> = mongoose.models.Settlement || 
  mongoose.model<ISettlement>('Settlement', settlementSchema);

const Group: Model<IGroup> = mongoose.models.Group || 
  mongoose.model<IGroup>('Group', groupSchema);

export { Group, Settlement };