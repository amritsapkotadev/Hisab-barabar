import assert from 'node:assert/strict'
import { personalExpenseSummary } from './personalExpenseSummary'

const start = new Date('2026-09-30T18:15:00.000Z')
const end = new Date('2026-10-31T18:15:00.000Z')
const expense = (amount: number, date: string) => ({
  amount, date, createdAt: start,
})

assert.deepEqual(personalExpenseSummary([], start, end), { count: 0, monthlySpent: 0 })
assert.deepEqual(personalExpenseSummary([
  expense(10, start.toISOString()),
  expense(20, '2026-10-15T00:00:00.000Z'),
  expense(40, '2026-09-30T18:14:59.999Z'),
  expense(80, end.toISOString()),
  expense(5, ''),
], start, end), { count: 5, monthlySpent: 35 })
