import type { NextRequest } from 'next/server'
import type { NextResponse } from 'next/server'
import { AuthError } from './auth-guard'
import { CsrfError } from './csrf'
import { errorResponse } from './response'
import { generateRequestId } from './request-id'
import { logSecurityEvent } from '@/lib/logger'

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const requestId = generateRequestId()
    try {
      ;(request as NextRequest & { requestId: string }).requestId = requestId
      return await handler(request, context)
    } catch (error) {
      if (error instanceof AuthError) {
        logSecurityEvent({
          level: 'warn',
          type: 'security',
          requestId,
          event: 'UNAUTHORIZED',
          route: request.nextUrl.pathname,
          ip: getClientIp(request),
          timestamp: new Date().toISOString(),
        })
        return errorResponse('AUTH', 'UNAUTHORIZED', 'Authentication required', requestId, 401)
      }
      if (error instanceof CsrfError) {
        logSecurityEvent({
          level: 'warn',
          type: 'security',
          requestId,
          event: 'CSRF_INVALID',
          route: request.nextUrl.pathname,
          ip: getClientIp(request),
          timestamp: new Date().toISOString(),
        })
        return errorResponse(
          'CSRF',
          'CSRF_INVALID',
          'CSRF token missing or invalid',
          requestId,
          403
        )
      }
      return errorResponse(
        'SERVER',
        'SERVER_ERROR',
        'An unexpected error occurred',
        requestId,
        500
      )
    }
  }
}

export function getRequestId(request: NextRequest): string {
  return (request as NextRequest & { requestId?: string }).requestId ?? generateRequestId()
}

export function getClientIpFromRequest(request: NextRequest): string {
  return getClientIp(request)
}

export async function requireParam(
  params: Promise<Record<string, string>>,
  key: string
): Promise<string> {
  const resolved = await params
  const value = resolved[key]
  if (!value) {
    throw new Error(`Missing required route parameter: ${key}`)
  }
  return value
}
