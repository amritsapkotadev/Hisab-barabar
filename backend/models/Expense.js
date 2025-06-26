const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0.01
  },
  paidBy: { 
    type: String, 
    required: true,
    trim: true
  },
  participants: [{ 
    type: String,
    required: true,
    trim: true
  }],
  splits: [{
    participant: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  payers: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  splitType: {
    type: String,
    enum: ['equal', 'unequal', 'percentage', 'shares'],
    default: 'equal'
  },
  groupId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Group', 
    required: true 
  },
  date: { 
    type: String, 
    required: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { 
  timestamps: true 
});

// Index for better query performance
expenseSchema.index({ groupId: 1, createdAt: -1 });

module.exports = mongoose.model('Expense', expenseSchema);