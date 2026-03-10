import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

function getAllowedEmails(): string[] {
  const raw = process.env.ADMIN_ALLOWED_EMAILS ?? ''
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    signIn({ user }) {
      const email = user.email?.toLowerCase()
      if (!email) return false
      const allowed = getAllowedEmails()
      return allowed.includes(email)
    },
    session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email
      }
      return session
    },
  },
}
