import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'

export const MAX_PROFILE_PICTURE_BYTES = 5 * 1024 * 1024
export const MAX_PROFILE_PICTURE_REQUEST_BYTES = MAX_PROFILE_PICTURE_BYTES + 1024 * 1024
const PROFILE_PICTURE_PREFIX = 'profile-pictures'
const SIGNED_URL_SECONDS = 24 * 60 * 60
const MAX_PROFILE_PICTURE_PIXELS = 25_000_000

let client: S3Client | undefined

export class ProfilePictureRequestTooLargeError extends Error {}

export async function readCappedRequestBody(
  body: ReadableStream<Uint8Array> | null,
  contentLength: string | null,
  maxBytes: number,
) {
  const declaredLength = Number(contentLength)
  if (contentLength && Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new ProfilePictureRequestTooLargeError()
  }
  if (!body) return Buffer.alloc(0)

  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > maxBytes) {
        await reader.cancel().catch((error) => {
          console.error('Failed to cancel oversized profile-image request:', error)
        })
        throw new ProfilePictureRequestTooLargeError()
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  return Buffer.concat(chunks, length)
}

function getR2() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET_NAME

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Cloudflare R2 profile-image storage is not configured')
  }

  client ??= new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  })

  return { client, bucket }
}

export function detectProfilePictureType(bytes: Buffer) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: 'image/jpeg', extension: 'jpg' }
  }
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { contentType: 'image/png', extension: 'png' }
  }
  if (
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { contentType: 'image/webp', extension: 'webp' }
  }
  return null
}

export async function validateProfilePicture(bytes: Buffer) {
  const type = detectProfilePictureType(bytes)
  if (!type) return null

  try {
    await sharp(bytes, {
      failOn: 'warning',
      limitInputPixels: MAX_PROFILE_PICTURE_PIXELS,
    }).stats()
  } catch {
    return null
  }
  return type
}

export function isProfilePictureKey(key: string) {
  return /^profile-pictures\/[a-f\d]{24}\/[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}\.(?:jpg|png|webp)$/i.test(key)
}

export async function storeProfilePicture(userId: string, bytes: Buffer, contentType: string) {
  const { client: r2, bucket } = getR2()
  const type = detectProfilePictureType(bytes)
  if (!type || type.contentType !== contentType) {
    throw new Error('Profile picture content is not a supported image')
  }

  const key = `${PROFILE_PICTURE_PREFIX}/${userId}/${randomUUID()}.${type.extension}`
  await r2.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: bytes,
    ContentLength: bytes.length,
    ContentType: type.contentType,
  }))
  return key
}

export async function signProfilePicture(key: string) {
  if (!isProfilePictureKey(key)) {
    throw new Error('Invalid stored profile picture key')
  }
  const { client: r2, bucket } = getR2()
  return getSignedUrl(r2, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: SIGNED_URL_SECONDS,
  })
}

export async function deleteProfilePicture(key: string) {
  if (!isProfilePictureKey(key)) {
    throw new Error('Invalid stored profile picture key')
  }
  const { client: r2, bucket } = getR2()
  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

export async function resolveProfilePicture(
  user: { picture?: string | null; customPictureKey?: string | null },
) {
  if (user.customPictureKey) {
    return signProfilePicture(user.customPictureKey)
  }
  return user.picture || undefined
}
