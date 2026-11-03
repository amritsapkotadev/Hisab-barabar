import assert from 'node:assert/strict'
import sharp from 'sharp'
import {
  detectProfilePictureType,
  isProfilePictureKey,
  MAX_PROFILE_PICTURE_REQUEST_BYTES,
  ProfilePictureRequestTooLargeError,
  readCappedRequestBody,
  validateProfilePicture,
} from './profilePictures'

assert.deepEqual(
  detectProfilePictureType(Buffer.from([0xff, 0xd8, 0xff, 0x00])),
  { contentType: 'image/jpeg', extension: 'jpg' },
)
assert.deepEqual(
  detectProfilePictureType(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  { contentType: 'image/png', extension: 'png' },
)
assert.deepEqual(
  detectProfilePictureType(Buffer.from('RIFF0000WEBP')),
  { contentType: 'image/webp', extension: 'webp' },
)
assert.equal(detectProfilePictureType(Buffer.from('<script>')), null)

assert.equal(
  isProfilePictureKey('profile-pictures/0123456789abcdef01234567/01234567-89ab-4cde-8123-456789abcdef.jpg'),
  true,
)
assert.equal(isProfilePictureKey('../private/anything.jpg'), false)
assert.equal(
  isProfilePictureKey('profile-pictures/0123456789abcdef01234567/01234567-89ab-4cde-8123-456789abcdef.svg'),
  false,
)

async function verifyUploadValidation() {
  const validPng = await sharp({
    create: { width: 1, height: 1, channels: 3, background: '#ffffff' },
  }).png().toBuffer()
  assert.deepEqual(await validateProfilePicture(validPng), {
    contentType: 'image/png',
    extension: 'png',
  })
  assert.equal(await validateProfilePicture(Buffer.from([0xff, 0xd8, 0xff, 0x00])), null)

  const body = (chunks: Uint8Array[]) => new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(chunk))
      controller.close()
    },
  })
  assert.deepEqual(
    await readCappedRequestBody(body([Buffer.from('abc')]), null, 4),
    Buffer.from('abc'),
  )
  await assert.rejects(
    readCappedRequestBody(body([Buffer.from('abc'), Buffer.from('de')]), null, 4),
    ProfilePictureRequestTooLargeError,
  )
  await assert.rejects(
    readCappedRequestBody(null, String(MAX_PROFILE_PICTURE_REQUEST_BYTES + 1), MAX_PROFILE_PICTURE_REQUEST_BYTES),
    ProfilePictureRequestTooLargeError,
  )
}

verifyUploadValidation().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
