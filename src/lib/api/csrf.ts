import { createHmac } from 'crypto'
import type { NextRequest } from 'next/server'

export class CsrfError extends Error {
  constructor(message: string = 'CSRF token missing or invalid') {
    super(message)
    this.name = 'CsrfError'
  }
}

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not configured')
  }
  return secret
}

export function generateCsrfToken(sessionEmail: string): string {
  const secret = getSecret()
  return createHmac('sha256', secret).update(sessionEmail).digest('hex')
}

export function validateCsrfToken(
  request: NextRequest,
  sessionEmail: string
): boolean {
  const token = request.headers.get('X-CSRF-Token')
  if (!token) return false
  const expected = generateCsrfToken(sessionEmail)
  return token === expected
}
