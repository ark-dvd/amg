import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const staticHeaders: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
}

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https://cdn.sanity.io",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.sanity.io",
    "frame-ancestors 'none'",
  ].join('; ')
}

function applySecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  for (const [key, value] of Object.entries(staticHeaders)) {
    response.headers.set(key, value)
  }
  response.headers.set('Content-Security-Policy', buildCsp(nonce))
  response.headers.set('x-nonce', nonce)
  return response
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const nonce = crypto.randomUUID()
  const { pathname } = request.nextUrl

  const isAdminPage = (pathname === '/admin' || pathname.startsWith('/admin/')) && pathname !== '/admin/login'
  const isAdminApi = pathname.startsWith('/api/admin/')

  if (isAdminPage || isAdminApi) {
    const token = await getToken({ req: request })

    if (!token) {
      if (isAdminApi) {
        const response = NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401 }
        )
        return applySecurityHeaders(response, nonce)
      }

      const loginUrl = new URL('/admin/login', request.url)
      const response = NextResponse.redirect(loginUrl)
      return applySecurityHeaders(response, nonce)
    }
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  return applySecurityHeaders(response, nonce)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
