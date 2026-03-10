import { NextRequest } from 'next/server'
import { z } from 'zod'
import { readClient, writeClient } from '@/lib/sanity/client'
import { requireAdmin } from '@/lib/api/auth-guard'
import { validateCsrfToken, CsrfError } from '@/lib/api/csrf'
import { checkRevConflict, getCurrentRev } from '@/lib/api/concurrency'
import { executeMutation } from '@/lib/api/mutation'
import { successResponse, errorResponse } from '@/lib/api/response'
import { withErrorHandler, getRequestId, requireParam } from '@/lib/api/route-handler'
import type { ProjectDocument } from '@/types/sanity'

const archiveSchema = z.object({
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
    const parsed = archiveSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(
        'VALIDATION',
        'VALIDATION_FAILED',
        'Input validation failed',
        requestId,
        400
      )
    }

    const project = await readClient.fetch<ProjectDocument | null>(
      '*[_id == $id][0]',
      { id }
    )
    if (!project) {
      return errorResponse('NOT_FOUND', 'NOT_FOUND', 'Project not found', requestId, 404)
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

    const testimonials = await readClient.fetch<{ _id: string }[]>(
      '*[_type == "testimonial" && projectRef._ref == $projectId]{ _id }',
      { projectId: id }
    )

    const result = await executeMutation<ProjectDocument>({
      requestId,
      route: `/api/admin/projects/${id}/archive`,
      method: 'PATCH',
      entityType: 'project',
      entityId: id,
      preWriteRev,
      writeOperation: async () => {
        let transaction = writeClient.transaction()
        transaction = transaction.patch(id, (patch) =>
          patch.set({
            isArchived: true,
            isActive: false,
            archivedAt: now,
            updatedAt: now,
          })
        )
        for (const t of testimonials) {
          transaction = transaction.patch(t._id, (patch) =>
            patch.set({
              isArchived: true,
              archivedAt: now,
              updatedAt: now,
            })
          )
        }
        await transaction.commit()
      },
      readBack: async () =>
        readClient.fetch<ProjectDocument | null>('*[_id == $id][0]', { id }),
      verifyReadBack: (doc) =>
        doc._id === id && doc._rev !== preWriteRev && doc.isArchived === true,
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
