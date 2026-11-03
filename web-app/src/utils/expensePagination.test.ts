import assert from 'node:assert/strict'
import { expensePagination, expensePage } from './expensePagination'

assert.equal(expensePagination(new URLSearchParams()), null)
assert.deepEqual(expensePagination(new URLSearchParams('page=2&limit=1000')), { page: 2, limit: 100, skip: 100 })
assert.deepEqual(expensePagination(new URLSearchParams('page=3')), { page: 3, limit: 20, skip: 40 })
for (const value of ['0', '-1', '1.5', 'abc', '', '9007199254740992']) {
  assert.throws(() => expensePagination(new URLSearchParams({ limit: value })), /limit/)
}
for (const value of ['', '0', '-1', '1.5', 'abc', '9007199254740991']) {
  assert.throws(() => expensePagination(new URLSearchParams({ page: value })), /page/)
}
const rows = [3, 2, 1]
const pagination = expensePagination(new URLSearchParams('limit=2'))
const first = expensePage(rows, pagination)
assert.equal(first.rows.length, 2)
assert.equal(first.pageInfo?.hasMore, true)
assert.equal(first.pageInfo?.nextPage, 2)
assert.equal(first.pageInfo?.page, 1)
assert.equal(first.pageInfo?.limit, 2)
assert.deepEqual(expensePage(rows.slice(2), pagination).pageInfo, { page: 1, limit: 2, hasMore: false, nextPage: null })
assert.deepEqual(expensePage([], pagination).pageInfo, { page: 1, limit: 2, hasMore: false, nextPage: null })
assert.equal(expensePage(rows, null).rows.length, 3)
console.log('Expense pagination assertions passed')
