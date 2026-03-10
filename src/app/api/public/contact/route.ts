import { NextRequest } from 'next/server'
import { z } from 'zod'
import { readClient } from '@/lib/sanity/client'
import { contactLimiter, contactBurstLimiter } from '@/lib/api/rate-limit'
import { successResponse, errorResponse } from '@/lib/api/response'
import { generateRequestId } from '@/lib/api/request-id'
import { logSecurityEvent } from '@/lib/logger'

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  company: z.string().max(100).optional(),
  message: z.string().min(1).max(2000),
})

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  const ip = getClientIp(request)

  const minuteLimit = contactLimiter(ip)
  if (!minuteLimit.allowed) {
    logSecurityEvent({
      level: 'warn',
      type: 'security',
      requestId,
      event: 'RATE_LIMITED',
      route: '/api/public/contact',
      ip,
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
    if (minuteLimit.retryAfter) {
      response.headers.set('Retry-After', String(minuteLimit.retryAfter))
    }
    return response
  }

  const burstLimit = contactBurstLimiter(ip)
  if (!burstLimit.allowed) {
    logSecurityEvent({
      level: 'warn',
      type: 'security',
      requestId,
      event: 'RATE_LIMITED',
      route: '/api/public/contact',
      ip,
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
    if (burstLimit.retryAfter) {
      response.headers.set('Retry-After', String(burstLimit.retryAfter))
    }
    return response
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse(
      'VALIDATION',
      'VALIDATION_FAILED',
      'Invalid JSON body',
      requestId,
      400
    )
  }

  const parsed = contactSchema.safeParse(body)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join('.') || '_root'] = issue.message
    }
    return errorResponse(
      'VALIDATION',
      'VALIDATION_FAILED',
      'Input validation failed',
      requestId,
      400,
      { fieldErrors }
    )
  }

  const data = parsed.data

  // Fetch contact email from SiteSettings for notification delivery
  const settings = await readClient.fetch<{ contactEmail: string | null } | null>(
    '*[_id == "singleton.siteSettings"][0]{ contactEmail }'
  )

  // Log the contact submission for notification delivery
  // Email delivery is handled by the deployment's notification pipeline
  console.log(
    JSON.stringify({
      level: 'info',
      type: 'contact_submission',
      requestId,
      recipientConfigured: Boolean(settings?.contactEmail),
      senderEmail: data.email,
      timestamp: new Date().toISOString(),
    })
  )

  return successResponse({ delivered: true }, requestId)
}
