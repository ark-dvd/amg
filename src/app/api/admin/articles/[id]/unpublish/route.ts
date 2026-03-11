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
import type { ArticleDocument } from '@/types/sanity'

const unpublishSchema = z.object({
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
    const parsed = unpublishSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(
        'VALIDATION',
        'VALIDATION_FAILED',
        'Input validation failed',
        requestId,
        400
      )
    }

    const article = await readClient.fetch<ArticleDocument | null>(
      '*[_id == $id][0]',
      { id }
    )
    if (!article) {
      return errorResponse('NOT_FOUND', 'NOT_FOUND', 'Article not found', requestId, 404)
    }

    const conflict = await checkRevConflict(id, parsed.data._rev)
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
    const now = new Date().toISOString()

    const result = await executeMutation<ArticleDocument>({
      requestId,
      route: `/api/admin/articles/${id}/unpublish`,
      method: 'PATCH',
      entityType: 'article',
      entityId: id,
      preWriteRev,
      writeOperation: async () => {
        await writeClient
          .patch(id)
          .set({
            isDraft: true,
            isPublished: false,
            updatedAt: now,
          })
          .commit()
      },
      readBack: async () =>
        writeClient.fetch<ArticleDocument | null>('*[_id == $id][0]', { id }),
      verifyReadBack: (doc) =>
        doc._id === id &&
        doc._rev !== preWriteRev &&
        doc.isDraft === true,
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
    revalidatePath('/insights')
    revalidatePath('/insights/[slug]', 'page')

    return successResponse(result.data, requestId)
  }
)
