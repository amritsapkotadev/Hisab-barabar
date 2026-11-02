interface ExpenseInput {
  amount: number
  paidBy?: string
  participants?: string[]
  splits?: Array<{ participant: string; amount?: number }>
  payers?: Array<{ name: string; amountPaid: number }>
  splitType?: string
}

interface SettlementInput {
  fromUserId: string
  toUserId: string
  amount: number
}

function amountInCents(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Expense and settlement amounts must be positive finite numbers.')
  }
  return Math.round((amount + Number.EPSILON) * 100)
}

function checkTotal(actual: number, expected: number, message: string) {
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > 0.0100001) {
    throw new Error(message)
  }
}

function allocate(total: number, weights: Array<{ id: string; weight: number }>) {
  const weightTotal = weights.reduce((sum, entry) => sum + entry.weight, 0)
  if (!weights.length || !Number.isFinite(weightTotal) || weightTotal <= 0 ||
      weights.some(entry => !Number.isFinite(entry.weight) || entry.weight < 0)) {
    throw new Error('Expense allocations must have valid, positive total weights.')
  }

  const allocations = weights.map((entry, index) => {
    const exact = total * entry.weight / weightTotal
    const floor = Math.floor(exact)
    return { id: entry.id, cents: floor, remainder: exact - floor, index }
  })
  let remainder = total - allocations.reduce((sum, entry) => sum + entry.cents, 0)
  allocations.sort((a, b) => b.remainder - a.remainder || a.index - b.index)
  for (let index = 0; remainder > 0; index++, remainder--) {
    allocations[index % allocations.length].cents++
  }
  return allocations
}

function requireMember(id: string, balances: Record<string, number>) {
  if (!Object.prototype.hasOwnProperty.call(balances, id)) {
    throw new Error(`Expense references unknown group member "${id}".`)
  }
}

export function calculateGroupBalances(
  memberIds: string[],
  expenses: ExpenseInput[],
  settlements: SettlementInput[] = [],
) {
  const balances: Record<string, number> = Object.fromEntries(
    memberIds.map(id => [id, 0]),
  )

  for (const expense of expenses) {
    const total = amountInCents(expense.amount)
    let payers: Array<{ id: string; weight: number }>
    if (expense.payers?.length) {
      if (new Set(expense.payers.map(payer => payer.name)).size !== expense.payers.length) {
        throw new Error('Expense contains duplicate payer allocations.')
      }
      checkTotal(
        expense.payers.reduce((sum, payer) => sum + payer.amountPaid, 0),
        expense.amount,
        'Expense payer amounts do not equal the expense total.',
      )
      payers = expense.payers.map(payer => ({ id: payer.name, weight: payer.amountPaid }))
    } else if (expense.paidBy && expense.paidBy !== 'Multiple') {
      payers = [{ id: expense.paidBy, weight: expense.amount }]
    } else {
      throw new Error('Expense is missing valid payer allocations.')
    }

    const rawSplits = expense.splits?.length
      ? expense.splits.map(split => ({ id: split.participant, weight: split.amount }))
      : expense.splitType === 'equal'
        ? (expense.participants ?? []).map(id => ({ id, weight: 1 }))
        : []
    if (!rawSplits.length || rawSplits.some(split => split.weight === undefined)) {
      throw new Error('Expense is missing valid participant allocations.')
    }
    if (new Set(rawSplits.map(split => split.id)).size !== rawSplits.length) {
      throw new Error('Expense contains duplicate participant allocations.')
    }
    if (expense.splits?.length) {
      checkTotal(
        rawSplits.reduce((sum, split) => sum + split.weight!, 0),
        expense.amount,
        'Expense split amounts do not equal the expense total.',
      )
    }

    for (const payer of payers) requireMember(payer.id, balances)
    for (const split of rawSplits) requireMember(split.id, balances)

    for (const allocation of allocate(total, payers)) {
      balances[allocation.id] += allocation.cents
    }
    for (const allocation of allocate(total, rawSplits.map(split => ({
      id: split.id,
      weight: split.weight!,
    })))) {
      balances[allocation.id] -= allocation.cents
    }
  }

  for (const settlement of settlements) {
    const amount = amountInCents(settlement.amount)
    requireMember(settlement.fromUserId, balances)
    requireMember(settlement.toUserId, balances)
    if (settlement.fromUserId === settlement.toUserId) {
      throw new Error('A settlement cannot be between the same group member.')
    }
    balances[settlement.fromUserId] += amount
    balances[settlement.toUserId] -= amount
  }

  return Object.fromEntries(
    Object.entries(balances).map(([id, cents]) => [id, cents / 100]),
  )
}
