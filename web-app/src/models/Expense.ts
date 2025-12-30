import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISplit {
  participant: string
  amount?: number
  percentage?: number
}

export interface IPayer {
  name: string
  amountPaid: number
}

export interface IExpense extends Document {
  description: string
  amount: number
  date: string
  type: 'personal' | 'group'
  createdBy: mongoose.Types.ObjectId
  groupId?: mongoose.Types.ObjectId | null
  paidBy?: string
  participants?: string[]
  splits?: ISplit[]
  payers?: IPayer[]
  splitType: 'equal' | 'unequal' | 'percentage' | 'shares'
  createdAt: Date
  updatedAt: Date
}

const expenseSchema = new Schema<IExpense>(
  {
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    date: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['personal', 'group'],
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    paidBy: {
      type: String,
      trim: true,
    },
    participants: [
      {
        type: String,
        trim: true,
      },
    ],
    splits: [
      {
        participant: {
          type: String,
          trim: true,
        },
        amount: {
          type: Number,
          min: 0,
        },
        percentage: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
    ],
    payers: [
      {
        name: {
          type: String,
          trim: true,
        },
        amountPaid: {
          type: Number,
          min: 0,
        },
      },
    ],
    splitType: {
      type: String,
      enum: ['equal', 'unequal', 'percentage', 'shares'],
      default: 'equal',
    },
  },
  {
    timestamps: true,
  }
)

const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', expenseSchema)

export default Expense
