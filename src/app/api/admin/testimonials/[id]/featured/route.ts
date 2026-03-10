import { NextRequest } from 'next/server'
import { z } from 'zod'
import { readClient, writeClient } from '@/lib/sanity/client'
import { requireAdmin } from '@/lib/api/auth-guard'
import { validateCsrfToken, CsrfError } from '@/lib/api/csrf'
import { checkRevConflict, getCurrentRev } from '@/lib/api/concurrency'
import { executeMutation } from '@/lib/api/mutation'
import { successResponse, errorResponse } from '@/lib/api/response'
import { withErrorHandler, getRequestId, requireParam } from '@/lib/api/route-handler'
import type { TestimonialDocument } from '@/types/sanity'

const featuredSchema = z.object({
  featuredOnPortfolio: z.boolean(),
  _rev: z.string(),
})

export const PATCH = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const requestId = getRequestId(request)
    const session = await requireAdmin()
    const id = await requireParam(params, 'id')

    if (!validateCsrfToken(request, session.user.email)) {
      throw new CsrfError()
    }

    const body: unknown = await request.json()
    const parsed = featuredSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(
        'VALIDATION',
        'VALIDATION_FAILED',
        'Input validation failed',
        requestId,
        400
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

    const result = await executeMutation<TestimonialDocument>({
      requestId,
      route: `/api/admin/testimonials/${id}/featured`,
      method: 'PATCH',
      entityType: 'testimonial',
      entityId: id,
      preWriteRev,
      writeOperation: async () => {
        await writeClient
          .patch(id)
          .set({
            featuredOnPortfolio: data.featuredOnPortfolio,
            updatedAt: new Date().toISOString(),
          })
          .commit()
      },
      readBack: async () =>
        readClient.fetch<TestimonialDocument | null>('*[_id == $id][0]', { id }),
      verifyReadBack: (doc) =>
        doc._id === id && doc._rev !== preWriteRev,
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

    return successResponse(result.data, requestId)
  }
)
