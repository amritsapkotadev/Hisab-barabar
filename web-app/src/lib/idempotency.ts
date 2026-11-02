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
  try {
    const text = await boundedText(request.clone(), MAX_REQUEST_BYTES)
    const body = text ? JSON.parse(text) : null
    const url = new URL(request.url)
    const method = request.method.toUpperCase()
    const ifMatch = request.headers.get('If-Match') ?? undefined
    if ((method === 'PUT' || method === 'DELETE') &&
        (ifMatch === undefined || !/^"(0|[1-9]\d*)"$/.test(ifMatch) ||
          !Number.isSafeInteger(Number(ifMatch.slice(1, -1))))) {
      return jsonError('Keyed expense edits and deletes require a quoted nonnegative integer If-Match revision', 400)
    }
    requestHash = hashRequest(method, url.pathname + url.search, body, ifMatch)
  } catch {
    return jsonError('Keyed expense requests require valid JSON of at most 64 KiB', 400)
  }

  try {
    await store.initialize()
    if (!await store.reserve(userId, key, requestHash)) {
      const record = await store.find(userId, key)
      if (record && record.requestHash !== requestHash) {
        return jsonError('Idempotency-Key was already used with a different request. Manual review required; do not submit this expense with a new key.', 409)
      }
      if (record?.state !== 'completed' ||
          typeof record.responseStatus !== 'number' ||
          typeof record.responseBody !== 'string') {
        return jsonError(MANUAL_REVIEW_MESSAGE, 409)
      }
      return withIdempotencySupport(new Response(record.responseBody, {
        status: record.responseStatus,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      }))
    }

    const response = await execute()
    const body = await boundedText(response.clone(), MAX_RESPONSE_BYTES)
    // Persist failures too. If persistence is uncertain, the reservation never expires.
    await store.complete(userId, key, response.status, body)
    response.headers.set('Cache-Control', 'no-store')
    return withIdempotencySupport(response)
  } catch {
    return jsonError(MANUAL_REVIEW_MESSAGE, 409)
  }
}
