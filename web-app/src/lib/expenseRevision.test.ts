import assert from 'node:assert/strict'
import { expenseRevisionFilter, readExpenseRevision } from './expenseRevision'

assert.equal(readExpenseRevision(null, 3), 3)
assert.equal(readExpenseRevision('"0"', 3), 0)
assert.equal(readExpenseRevision('"12"', 3), 12)
assert.equal(readExpenseRevision(`"${Number.MAX_SAFE_INTEGER}"`, 0), Number.MAX_SAFE_INTEGER)
for (const header of ['0', '"01"', '"-1"', '"1.5"', 'W/"1"', '*', '"1", "2"', '"9007199254740992"', '"1"\n']) {
  assert.equal(readExpenseRevision(header, 0), null, `Reject invalid If-Match ${header}`)
}
assert.deepEqual(expenseRevisionFilter('expense-1', 0), {
  _id: 'expense-1', $or: [{ revision: 0 }, { revision: { $exists: false } }],
})
assert.deepEqual(expenseRevisionFilter('expense-1', 2), { _id: 'expense-1', revision: 2 })
console.log('Expense revision checks passed')