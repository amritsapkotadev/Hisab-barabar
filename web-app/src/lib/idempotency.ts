import { createHash } from 'node:crypto'

export const MAX_REQUEST_BYTES = 64 * 1024
export const MAX_RESPONSE_BYTES = 256 * 1024
export const MANUAL_REVIEW_MESSAGE =
  'This expense request is in progress or its outcome is uncertain. Manual review required: check your expenses before taking further action. Do not retry with a new key.'

export interface IdempotencyRecord {
  requestHash: string
  state: 'reserved' | 'completed'
  responseStatus?: number
  responseBody?: string
}

export interface IdempotencyStore {
  initialize(): Promise<unknown>
  reserve(userId: string, key: string, requestHash: string): Promise<boolean>
  find(userId: string, key: string): Promise<IdempotencyRecord | null>
  complete(userId: string, key: string, status: number, body: string): Promise<void>
  reopenRejectedUpdate?(
    userId: string, key: string, requestHash: string, responseBody: string,
  ): Promise<boolean>
}

function canonicalJSON(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`
  if (value !== null && typeof value === 'object') {
    const object = value as Record<string, unknown>
    return `{${Object.keys(object).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJSON(object[key])}`
    ).join(',')}}`
  }
  return JSON.stringify(value)
}

export function hashRequest(method: string, path: string, body: unknown, ifMatch?: string): string {
  return createHash('sha256')
    .update(canonicalJSON(ifMatch === undefined
      ? [method.toUpperCase(), path, body]
      : [method.toUpperCase(), path, body, { ifMatch }]))
    .digest('hex')
}

export function withIdempotencySupport(response: Response): Response {
  response.headers.set('X-Idempotency-Supported', 'true')
  return response
}

function jsonError(message: string, status: number): Response {
  return withIdempotencySupport(Response.json({ message }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  }))
}

async function boundedText(response: Request | Response, limit: number): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > limit) throw new Error('Body exceeds idempotency limit')
      chunks.push(value)
    }
    return Buffer.concat(chunks).toString('utf8')
  } finally {
    // A cloned stream's cancellation waits for its unread sibling.
    void reader.cancel().catch(() => {})
  }
}

function isAllocationRejection(body: string) {
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return false
  }
  if (!parsed || typeof parsed !== 'object' || !('message' in parsed) ||
      typeof parsed.message !== 'string') return false
  return [
    'Expense payer amounts do not equal the expense total.',
    'Expense split amounts do not equal the expense total.',
    'Expense participants must match the saved splits',
    'Expense allocations must reference group members',
  ].includes(parsed.message) ||
    /^Expense allocations must reference group members: (?:payers\[\d+\]\.name|splits\[\d+\]\.participant)=undefined(?:, (?:payers\[\d+\]\.name|splits\[\d+\]\.participant)=undefined)*\. Refresh the expense and review these references; names and account IDs are not group member IDs\.$/.test(parsed.message)
}

export async function idempotentCreate(
  request: Request,
  userId: string,
  store: IdempotencyStore,
  execute: () => Promise<Response>,
): Promise<Response> {
  const header = request.headers.get('Idempotency-Key')
  if (header === null) return withIdempotencySupport(await execute())
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(header)) {
    return jsonError('Idempotency-Key must be a UUID', 400)
  }
  const key = header.toLowerCase()
  let requestHash: string
  let canRetryAllocations = false
  try {
    const text = await boundedText(request.clone(), MAX_REQUEST_BYTES)
    const body: unknown = text ? JSON.parse(text) : null
    const url = new URL(request.url)
    const method = request.method.toUpperCase()
    const ifMatch = request.headers.get('If-Match') ?? undefined
    if ((method === 'PUT' || method === 'DELETE') &&
        (ifMatch === undefined || !/^"(0|[1-9]\d*)"$/.test(ifMatch) ||
          !Number.isSafeInteger(Number(ifMatch.slice(1, -1))))) {
      return jsonError('Keyed expense edits and deletes require a quoted nonnegative integer If-Match revision', 400)
    }
    requestHash = hashRequest(method, url.pathname + url.search, body, ifMatch)
    canRetryAllocations = method === 'PUT' && /^\/api\/expenses\/[^/]+$/.test(url.pathname) &&
      body !== null && typeof body === 'object' && !Array.isArray(body) &&
      !('payers' in body) && !('splits' in body)
  } catch {
    return jsonError('Keyed expense requests require valid JSON of at most 64 KiB', 400)
  }

  let stage = 'initialize'
  try {
    await store.initialize()
    stage = 'reserve'
    if (!await store.reserve(userId, key, requestHash)) {
      stage = 'read reservation'
      const record = await store.find(userId, key)
      if (record && record.requestHash !== requestHash) {
        return jsonError('Idempotency-Key was already used with a different request. Manual review required; do not submit this expense with a new key.', 409)
      }
      if (record?.state !== 'completed' ||
          typeof record.responseStatus !== 'number' ||
          typeof record.responseBody !== 'string') {
        return jsonError(MANUAL_REVIEW_MESSAGE, 409)
      }
      const allocationRejection = record.responseStatus === 400 && isAllocationRejection(record.responseBody)
      // These validations run before any expense write. Reacquire the same reservation, never a new key.
      if (canRetryAllocations && allocationRejection && store.reopenRejectedUpdate) {
        stage = 'reopen rejected allocation update'
        if (!await store.reopenRejectedUpdate(userId, key, requestHash, record.responseBody)) {
          return jsonError(MANUAL_REVIEW_MESSAGE, 409)
        }
      } else {
        return withIdempotencySupport(new Response(record.responseBody, {
          status: record.responseStatus,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        }))
      }
    }

    stage = 'execute'
    const response = await execute()
    stage = 'read response'
    const body = await boundedText(response.clone(), MAX_RESPONSE_BYTES)
    // Persist failures too. If persistence is uncertain, the reservation never expires.
    stage = 'complete'
    await store.complete(userId, key, response.status, body)
    response.headers.set('Cache-Control', 'no-store')
    return withIdempotencySupport(response)
  } catch (error) {
    console.error(`Expense idempotency failed during ${stage}:`, error)
    return jsonError(MANUAL_REVIEW_MESSAGE, 409)
  }
}
