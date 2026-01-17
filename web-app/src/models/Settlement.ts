import mongoose, { Schema, Document, Model } from 'mongoose';

import User from './User';

export interface ISettlement extends Document {
  groupId: mongoose.Types.ObjectId;
  fromUserId: string;
  toUserId: string;
  amount: number;
  date: Date;
  description?: string;
}

const settlementSchema = new Schema<ISettlement>({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  fromUserId: { type: String, required: true, trim: true },
  toUserId: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  date: { type: Date, default: Date.now },
  description: { type: String, trim: true },
});

const Settlement: Model<ISettlement> = mongoose.models.Settlement || mongoose.model<ISettlement>('Settlement', settlementSchema);

export default Settlement;
