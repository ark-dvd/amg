import { NextRequest } from 'next/server'
import { writeClient } from '@/lib/sanity/client'
import { requireAdmin } from '@/lib/api/auth-guard'
import { uploadLimiter } from '@/lib/api/rate-limit'
import { successResponse, errorResponse } from '@/lib/api/response'
import { withErrorHandler, getRequestId } from '@/lib/api/route-handler'
import { logSecurityEvent } from '@/lib/logger'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

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

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return errorResponse(
      'VALIDATION',
      'VALIDATION_FAILED',
      'File type not allowed. Accepted: JPEG, PNG, WebP, GIF',
      requestId,
      400,
      { fieldErrors: { file: `Invalid MIME type: ${file.type}` } }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return errorResponse(
      'VALIDATION',
      'VALIDATION_FAILED',
      'File size exceeds 10 MB limit',
      requestId,
      400,
      { fieldErrors: { file: 'File too large' } }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = file instanceof File ? file.name : 'upload'

  const asset = await writeClient.assets.upload('image', buffer, {
    filename,
    contentType: file.type,
  })

  return successResponse(
    {
      assetId: asset._id,
      url: asset.url,
      width: asset.metadata?.dimensions?.width ?? 0,
      height: asset.metadata?.dimensions?.height ?? 0,
    },
    requestId
  )
})
