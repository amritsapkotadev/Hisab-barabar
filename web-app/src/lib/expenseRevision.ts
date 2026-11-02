export function readExpenseRevision(header: string | null, current: number): number | null {
  if (header === null) return current
  if (!/^"(0|[1-9]\d*)"$/.test(header)) return null
  const revision = Number(header.slice(1, -1))
  return Number.isSafeInteger(revision) ? revision : null
}

export function expenseRevisionFilter(id: string, revision: number) {
  return revision === 0
    ? { _id: id, $or: [{ revision: 0 }, { revision: { $exists: false } }] }
    : { _id: id, revision }
}