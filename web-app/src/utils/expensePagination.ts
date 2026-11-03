export function expensePagination(params: URLSearchParams) {
  const rawLimit = params.get('limit')
  const rawPage = params.get('page')
  if (rawLimit === null && rawPage === null) return null
  if (rawLimit !== null && (!/^[1-9]\d*$/.test(rawLimit) || !Number.isSafeInteger(Number(rawLimit)))) {
    throw new Error('limit must be a positive integer')
  }
  const limit = Math.min(Number(rawLimit ?? 20), 100)
  const page = Number(rawPage ?? 1)
  if ((rawPage !== null && !/^[1-9]\d*$/.test(rawPage)) ||
      !Number.isSafeInteger(page) || !Number.isSafeInteger((page - 1) * limit) ||
      !Number.isSafeInteger(page + 1)) {
    throw new Error('page must be a positive safe integer with a valid offset')
  }
  return { page, limit, skip: (page - 1) * limit }
}

export function expensePage<T>(
  rows: T[],
  pagination: ReturnType<typeof expensePagination>,
) {
  if (!pagination) return { rows }
  const hasMore = rows.length > pagination.limit
  return {
    rows: rows.slice(0, pagination.limit),
    pageInfo: {
      page: pagination.page,
      limit: pagination.limit,
      hasMore,
      nextPage: hasMore ? pagination.page + 1 : null,
    },
  }
}
