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
import { sanityImageSchema, sanityFileSchema } from '@/lib/api/zod-helpers'
import type { HeroDocument } from '@/types/sanity'

const SINGLETON_ID = 'singleton.hero'

const heroSchema = z
  .object({
    mediaType: z.enum(['image', 'video']),
    image: sanityImageSchema.optional(),
    videoAsset: sanityFileSchema.optional(),
    videoPoster: sanityImageSchema.optional(),
    headline: z.string().min(1).max(100),
    subheadline: z.string().max(250).optional(),
    ctaLabel: z.string().min(1).max(50),
    ctaUrl: z.string().min(1),
    overlayOpacity: z.number().min(0).max(100).optional(),
    _rev: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.mediaType === 'image' && !data.image) return false
      if (data.mediaType === 'video' && !data.videoAsset) return false
      return true
    },
    { message: 'Image required for image type; video file required for video type' }
  )

async function fetchHero(): Promise<HeroDocument | null> {
  return writeClient.fetch<HeroDocument | null>('*[_id == $id][0]', {
    id: SINGLETON_ID,
  })
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request)
  await requireAdmin()

  const hero = await fetchHero()

  if (!hero) {
    return uninitializedResponse(requestId)
  }

  return successResponse(hero, requestId)
})

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request)
  const session = await requireAdmin()

  if (!validateCsrfToken(request, session.user.email)) {
    throw new CsrfError()
  }

  const body: unknown = await request.json()
  const parsed = heroSchema.safeParse(body)

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

  const result = await executeMutation<HeroDocument>({
    requestId,
    route: '/api/admin/hero',
    method: 'PUT',
    entityType: 'hero',
    entityId: SINGLETON_ID,
    preWriteRev,
    writeOperation: async () => {
      await writeClient.createOrReplace({
        _id: SINGLETON_ID,
        _type: 'hero',
        ...fields,
        updatedAt: new Date().toISOString(),
      })
    },
    readBack: fetchHero,
    verifyReadBack: (doc) =>
      doc._id === SINGLETON_ID &&
      doc._rev !== preWriteRev &&
      typeof doc.headline === 'string' &&
      doc.headline.length > 0,
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

  return successResponse(result.data, requestId)
})
