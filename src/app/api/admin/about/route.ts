import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { readClient, writeClient } from '@/lib/sanity/client'
import { requireAdmin } from '@/lib/api/auth-guard'
import { validateCsrfToken, CsrfError } from '@/lib/api/csrf'
import { checkRevConflict, getCurrentRev } from '@/lib/api/concurrency'
import { executeMutation } from '@/lib/api/mutation'
import {
  successResponse,
  uninitializedResponse,
  errorResponse,
} from '@/lib/api/response'
import { withErrorHandler, getRequestId } from '@/lib/api/route-handler'
import { sanityImageSchema, portableTextSchema } from '@/lib/api/zod-helpers'
import type { AboutDocument } from '@/types/sanity'

const SINGLETON_ID = 'singleton.about'

const aboutSchema = z.object({
  pageTitle: z.string().max(100).optional(),
  intro: z.string().max(500).optional(),
  body: portableTextSchema.optional(),
  teamSectionTitle: z.string().max(80).optional(),
  teamMembers: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        role: z.string().min(1).max(100),
        bio: z.string().max(400).optional(),
        photo: sanityImageSchema.optional(),
        linkedinUrl: z.string().url().optional(),
        order: z.number().int().min(0),
      })
    )
    .optional(),
  coverImage: sanityImageSchema.optional(),
  _rev: z.string().optional(),
})

async function fetchAbout(): Promise<AboutDocument | null> {
  return writeClient.fetch<AboutDocument | null>('*[_id == $id][0]', {
    id: SINGLETON_ID,
  })
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request)
  await requireAdmin()

  const about = await fetchAbout()
  if (!about) {
    return uninitializedResponse(requestId)
  }
  return successResponse(about, requestId)
})

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request)
  const session = await requireAdmin()

  if (!validateCsrfToken(request, session.user.email)) {
    throw new CsrfError()
  }

  const body: unknown = await request.json()
  const parsed = aboutSchema.safeParse(body)

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

  if (data._rev) {
    const conflict = await checkRevConflict(SINGLETON_ID, data._rev)
    if (conflict) {
      return errorResponse(
        'CONFLICT',
        'CONFLICT',
        'Document has been modified by another user. Please reload and try again.',
        requestId,
        409
      )
    }
  }

  const preWriteRev = await getCurrentRev(SINGLETON_ID)
  const { _rev: _submittedRev, ...fields } = data

  const result = await executeMutation<AboutDocument>({
    requestId,
    route: '/api/admin/about',
    method: 'PUT',
    entityType: 'about',
    entityId: SINGLETON_ID,
    preWriteRev,
    writeOperation: async () => {
      await writeClient.createOrReplace({
        _id: SINGLETON_ID,
        _type: 'about',
        ...fields,
        updatedAt: new Date().toISOString(),
      })
    },
    readBack: fetchAbout,
    verifyReadBack: (doc) =>
      doc._id === SINGLETON_ID &&
      doc._rev !== preWriteRev,
  })

  if (!result.success) {
    return errorResponse(
      'PERSISTENCE',
      result.code,
      result.message,
      requestId,
      500,
      { mayHavePersisted: result.mayHavePersisted, retryable: true }
    )
  }

  revalidatePath('/')
  revalidatePath('/about')

  return successResponse(result.data, requestId)
})
