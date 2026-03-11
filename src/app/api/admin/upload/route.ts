import { NextRequest } from 'next/server'
import { writeClient } from '@/lib/sanity/client'
import { requireAdmin } from '@/lib/api/auth-guard'
import { uploadLimiter } from '@/lib/api/rate-limit'
import { successResponse, errorResponse } from '@/lib/api/response'
import { withErrorHandler, getRequestId } from '@/lib/api/route-handler'
import { logSecurityEvent } from '@/lib/logger'

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
])

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50 MB

export const POST = withErrorHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request)
  const session = await requireAdmin()

  const limitResult = uploadLimiter(session.user.email)
  if (!limitResult.allowed) {
    logSecurityEvent({
      level: 'warn',
      type: 'security',
      requestId,
      event: 'RATE_LIMITED',
      route: '/api/admin/upload',
      ip: request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ?? 'unknown',
      timestamp: new Date().toISOString(),
    })
    const response = errorResponse(
      'SERVER',
      'RATE_LIMITED',
      'Too many requests. Please wait before trying again.',
      requestId,
      429,
      { retryable: true }
    )
    if (limitResult.retryAfter) {
      response.headers.set('Retry-After', String(limitResult.retryAfter))
    }
    return response
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof Blob)) {
    return errorResponse(
      'VALIDATION',
      'VALIDATION_FAILED',
      'No file provided',
      requestId,
      400
    )
  }

  const isImage = ALLOWED_IMAGE_TYPES.has(file.type)
  const isVideo = ALLOWED_VIDEO_TYPES.has(file.type)

  if (!isImage && !isVideo) {
    return errorResponse(
      'VALIDATION',
      'VALIDATION_FAILED',
      'File type not allowed. Accepted: JPEG, PNG, WebP, GIF, MP4, WebM, OGG',
      requestId,
      400,
      { fieldErrors: { file: `Invalid MIME type: ${file.type}` } }
    )
  }

  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
  const maxLabel = isVideo ? '50 MB' : '10 MB'

  if (file.size > maxSize) {
    return errorResponse(
      'VALIDATION',
      'VALIDATION_FAILED',
      `File size exceeds ${maxLabel} limit`,
      requestId,
      400,
      { fieldErrors: { file: 'File too large' } }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = file instanceof File ? file.name : 'upload'
  const assetType = isVideo ? 'file' : 'image'

  const asset = await writeClient.assets.upload(assetType, buffer, {
    filename,
    contentType: file.type,
  })

  return successResponse(
    {
      assetId: asset._id,
      url: asset.url,
      ...(isImage
        ? {
            width: asset.metadata?.dimensions?.width ?? 0,
            height: asset.metadata?.dimensions?.height ?? 0,
          }
        : {
            size: file.size,
            mimeType: file.type,
          }),
    },
    requestId
  )
})
