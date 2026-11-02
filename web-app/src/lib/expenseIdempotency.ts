import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/middleware/auth'
import { expenseIdempotencyStore } from '@/models/ExpenseIdempotency'
import { idempotentCreate, withIdempotencySupport } from './idempotency'

export async function withExpenseIdempotency(
  request: NextRequest,
  execute: () => Promise<NextResponse>,
): Promise<Response> {
  if (!request.headers.has('Idempotency-Key')) {
    return withIdempotencySupport(await execute())
  }
  // Recheck the token and current user even when returning a stored response.
  const auth = await authenticateUser(request)
  if ('error' in auth) {
    return withIdempotencySupport(NextResponse.json(
      { message: auth.error },
      { status: auth.status, headers: { 'Cache-Control': 'no-store' } },
    ))
  }
  return idempotentCreate(request, auth.userId, expenseIdempotencyStore, execute)
}
