import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { authenticateUser } from '@/middleware/auth'
import {
  deleteProfilePicture,
  MAX_PROFILE_PICTURE_BYTES,
  MAX_PROFILE_PICTURE_REQUEST_BYTES,
  ProfilePictureRequestTooLargeError,
  readCappedRequestBody,
  resolveProfilePicture,
  storeProfilePicture,
  validateProfilePicture,
} from '@/lib/profilePictures'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let uploadedKey: string | undefined

  try {
    const auth = await authenticateUser(request)
    if ('error' in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status })
    }

    let requestBody: Buffer
    try {
      requestBody = await readCappedRequestBody(
        request.body,
        request.headers.get('content-length'),
        MAX_PROFILE_PICTURE_REQUEST_BYTES,
      )
    } catch (error) {
      if (error instanceof ProfilePictureRequestTooLargeError) {
        return NextResponse.json({ message: 'Profile image request is too large' }, { status: 413 })
      }
      throw error
    }

    let formData: FormData
    try {
      const parseableBody = Uint8Array.from(requestBody)
      formData = await new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: parseableBody,
      }).formData()
    } catch {
      return NextResponse.json({ message: 'Invalid profile image upload form' }, { status: 400 })
    }
    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ message: 'A profile image file is required' }, { status: 400 })
    }
    if (file.size === 0 || file.size > MAX_PROFILE_PICTURE_BYTES) {
      return NextResponse.json(
        { message: 'Profile images must be between 1 byte and 5 MB' },
        { status: 413 },
      )
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    if (bytes.length === 0 || bytes.length > MAX_PROFILE_PICTURE_BYTES) {
      return NextResponse.json(
        { message: 'Profile images must be between 1 byte and 5 MB' },
        { status: 413 },
      )
    }

    const imageType = await validateProfilePicture(bytes)
    if (!imageType) {
      return NextResponse.json(
        { message: 'Only JPEG, PNG, and WebP profile images are supported' },
        { status: 415 },
      )
    }

    await connectDB()
    const newKey = await storeProfilePicture(auth.userId, bytes, imageType.contentType)
    uploadedKey = newKey
    const picture = await resolveProfilePicture({ customPictureKey: newKey })
    const previousUser = await User.findByIdAndUpdate(
      auth.userId,
      { customPictureKey: newKey },
      { new: false, runValidators: true },
    )

    if (!previousUser) {
      await deleteProfilePicture(uploadedKey)
      uploadedKey = undefined
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const previousKey = previousUser.customPictureKey
    uploadedKey = undefined
    if (previousKey && previousKey !== newKey) {
      try {
        await deleteProfilePicture(previousKey)
      } catch (error) {
        console.error('Failed to remove replaced profile image from R2:', error)
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: previousUser._id,
        name: previousUser.name,
        email: previousUser.email,
        phone: previousUser.phone,
        picture,
        budget: previousUser.budget,
      },
    })
  } catch (error) {
    if (uploadedKey) {
      try {
        await deleteProfilePicture(uploadedKey)
      } catch (cleanupError) {
        console.error('Failed to clean up incomplete profile image upload:', cleanupError)
      }
    }
    console.error('Upload profile image error:', error)
    return NextResponse.json(
      { message: 'Server error while uploading profile image' },
      { status: 500 },
    )
  }
}
