import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request)
  const headers = { 'Cache-Control': 'no-store' }
  if ('error' in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status, headers })
  }
  return NextResponse.json({
    success: true,
    data: { expenseCreateIdempotency: true, expenseMutationIdempotency: true },
  }, { headers })
}
