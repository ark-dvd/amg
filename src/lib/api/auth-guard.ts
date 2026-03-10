import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export class AuthError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthError'
  }
}

function getAllowedEmails(): string[] {
  const raw = process.env.ADMIN_ALLOWED_EMAILS ?? ''
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
}

interface AdminSession {
  user: {
    email: string
    name?: string | null
    image?: string | null
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    throw new AuthError()
  }

  const email = session.user.email.toLowerCase()
  const allowed = getAllowedEmails()

  if (!allowed.includes(email)) {
    throw new AuthError('Access denied')
  }

  return { user: { email, name: session.user.name, image: session.user.image } }
}
