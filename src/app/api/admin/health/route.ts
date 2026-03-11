import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readClient } from '@/lib/sanity/client'

export async function GET(request: NextRequest) {
  const checks: Record<string, unknown> = {}

  // 1. Env vars
  checks.envVars = {
    NEXT_PUBLIC_SANITY_PROJECT_ID: !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: !!process.env.NEXT_PUBLIC_SANITY_DATASET,
    SANITY_API_TOKEN: !!process.env.SANITY_API_TOKEN,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? '(not set)',
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    ADMIN_ALLOWED_EMAILS: !!process.env.ADMIN_ALLOWED_EMAILS,
  }

  // 2. Auth session
  try {
    const session = await getServerSession(authOptions)
    checks.session = session
      ? { ok: true, email: session.user?.email }
      : { ok: false, reason: 'no session' }
  } catch (err) {
    checks.session = { ok: false, error: String(err) }
  }

  // 3. Sanity read
  try {
    const doc = await readClient.fetch('*[_id == "singleton.siteSettings"][0]{_id, _rev}')
    checks.sanityRead = doc ? { ok: true, _id: doc._id, _rev: doc._rev } : { ok: false, reason: 'null' }
  } catch (err) {
    checks.sanityRead = { ok: false, error: String(err) }
  }

  return NextResponse.json(checks)
}
