export function personalExpenseSummary(
  expenses: { amount: number; date: string; createdAt: Date }[],
  monthStart: Date,
  monthEnd: Date
) {
  const monthlySpent = expenses.reduce((sum, expense) => {
    const date = new Date(expense.date || expense.createdAt)
    return date >= monthStart && date < monthEnd ? sum + expense.amount : sum
  }, 0)

  return { count: expenses.length, monthlySpent }
}
