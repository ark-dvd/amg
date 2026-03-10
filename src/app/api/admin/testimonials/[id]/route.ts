import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { readClient, writeClient } from '@/lib/sanity/client'
import { requireAdmin } from '@/lib/api/auth-guard'
import { validateCsrfToken, CsrfError } from '@/lib/api/csrf'
import { checkRevConflict, getCurrentRev } from '@/lib/api/concurrency'
import { executeMutation } from '@/lib/api/mutation'
import { successResponse, errorResponse } from '@/lib/api/response'
import { withErrorHandler, getRequestId, requireParam } from '@/lib/api/route-handler'
import { sanityImageSchema } from '@/lib/api/zod-helpers'
import { logMutation } from '@/lib/logger'
import type { TestimonialDocument } from '@/types/sanity'

const updateTestimonialSchema = z.object({
  authorName: z.string().min(1).max(100),
  authorRole: z.string().max(100).optional(),
  authorCompany: z.string().max(100).optional(),
  authorPhoto: sanityImageSchema.optional(),
  quote: z.string().min(1).max(600),
  projectRef: z.object({
    _type: z.literal('reference'),
    _ref: z.string(),
  }),
  featuredOnPortfolio: z.boolean(),
  order: z.number().int().min(0),
  _rev: z.string(),
})

async function fetchTestimonial(id: string): Promise<TestimonialDocument | null> {
  return readClient.fetch<TestimonialDocument | null>('*[_id == $id][0]', { id })
}

export const PUT = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const requestId = getRequestId(request)
    const session = await requireAdmin()
    const id = await requireParam(params, 'id')

    if (!validateCsrfToken(request, session.user.email)) {
      throw new CsrfError()
    }

    const body: unknown = await request.json()
    const parsed = updateTestimonialSchema.safeParse(body)

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
    const conflict = await checkRevConflict(id, data._rev)
    if (conflict) {
      return errorResponse(
        'CONFLICT',
        'CONFLICT',
        'Document has been modified by another user. Please reload and try again.',
        requestId,
        409
      )
    }

    const preWriteRev = await getCurrentRev(id)
    const { _rev: _submittedRev, ...fields } = data

    const result = await executeMutation<TestimonialDocument>({
      requestId,
      route: `/api/admin/testimonials/${id}`,
      method: 'PUT',
      entityType: 'testimonial',
      entityId: id,
      preWriteRev,
      writeOperation: async () => {
        await writeClient
          .patch(id)
          .set({
            ...fields,
            updatedAt: new Date().toISOString(),
          })
          .commit()
      },
      readBack: () => fetchTestimonial(id),
      verifyReadBack: (doc) =>
        doc._id === id &&
        doc._rev !== preWriteRev &&
        typeof doc.authorName === 'string' &&
        doc.authorName.length > 0,
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
    revalidatePath('/portfolio')
    revalidatePath('/portfolio/[slug]', 'page')

    return successResponse(result.data, requestId)
  }
)

export const DELETE = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const requestId = getRequestId(request)
    const session = await requireAdmin()
    const id = await requireParam(params, 'id')

    if (!validateCsrfToken(request, session.user.email)) {
      throw new CsrfError()
    }

    const testimonial = await fetchTestimonial(id)
    if (!testimonial) {
      return errorResponse('NOT_FOUND', 'NOT_FOUND', 'Testimonial not found', requestId, 404)
    }

    if (testimonial.isArchived) {
      return errorResponse(
        'CONFLICT',
        'CONFLICT',
        'Archived testimonials are deleted via the project deletion flow',
        requestId,
        409
      )
    }

    const startTime = Date.now()
    await writeClient.delete(id)

    logMutation({
      level: 'info',
      type: 'mutation',
      requestId,
      route: `/api/admin/testimonials/${id}`,
      method: 'DELETE',
      entityType: 'testimonial',
      entityId: id,
      outcome: 'SUCCESS',
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/')
    revalidatePath('/portfolio')
    revalidatePath('/portfolio/[slug]', 'page')

    return successResponse({ deleted: true, id }, requestId)
  }
)
