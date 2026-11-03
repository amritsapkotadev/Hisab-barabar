import mongoose, { Schema, Model } from 'mongoose'
import type { IdempotencyRecord, IdempotencyStore } from '../lib/idempotency'

interface IExpenseIdempotency extends IdempotencyRecord {
  userId: mongoose.Types.ObjectId
  key: string
}

const schema = new Schema<IExpenseIdempotency>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  key: { type: String, required: true, immutable: true, maxlength: 36 },
  requestHash: { type: String, required: true, immutable: true, maxlength: 64 },
  state: { type: String, enum: ['reserved', 'completed'], required: true },
  responseStatus: Number,
  responseBody: String,
}, {
  timestamps: true,
  autoIndex: false,
  autoCreate: false,
  writeConcern: { w: 'majority', j: true },
})

// No TTL: deleting a reservation would allow a previously executed request to run again.
schema.index({ userId: 1, key: 1 }, { unique: true })

const ExpenseIdempotency: Model<IExpenseIdempotency> =
  mongoose.models.ExpenseIdempotency ||
  mongoose.model<IExpenseIdempotency>('ExpenseIdempotency', schema)

let initialization: Promise<void> | null = null

export const expenseIdempotencyStore: IdempotencyStore = {
  initialize() {
    if (!initialization) {
      // Model.init() caches import-time connection failures permanently.
      initialization = (async () => {
        await ExpenseIdempotency.createCollection()
        await ExpenseIdempotency.createIndexes()
      })().catch(error => {
        initialization = null
        throw error
      })
    }
    return initialization
  },
  async reserve(userId, key, requestHash) {
    try {
      await ExpenseIdempotency.create({ userId, key, requestHash, state: 'reserved' })
      return true
    } catch (error) {
      if ((error as { code?: number }).code === 11000) return false
      throw error
    }
  },
  async find(userId, key) {
    return ExpenseIdempotency.findOne({ userId, key }).read('primary').lean()
  },
  async complete(userId, key, responseStatus, responseBody) {
    const result = await ExpenseIdempotency.updateOne(
      { userId, key, state: 'reserved' },
      { $set: { state: 'completed', responseStatus, responseBody } },
    )
    if (result.modifiedCount !== 1) throw new Error('Idempotency completion was not confirmed')
  },
  async reopenRejectedUpdate(userId, key, requestHash, responseBody) {
    const result = await ExpenseIdempotency.updateOne(
      { userId, key, requestHash, state: 'completed', responseStatus: 400, responseBody },
      { $set: { state: 'reserved' }, $unset: { responseStatus: 1, responseBody: 1 } },
    )
    return result.modifiedCount === 1
  },
}

export default ExpenseIdempotency
