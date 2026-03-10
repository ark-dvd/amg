import { NextRequest } from 'next/server'
import { z } from 'zod'
import { readClient, writeClient } from '@/lib/sanity/client'
import { requireAdmin } from '@/lib/api/auth-guard'
import { validateCsrfToken, CsrfError } from '@/lib/api/csrf'
import { checkRevConflict, getCurrentRev } from '@/lib/api/concurrency'
import { executeMutation } from '@/lib/api/mutation'
import { successResponse, errorResponse } from '@/lib/api/response'
import { withErrorHandler, getRequestId, requireParam } from '@/lib/api/route-handler'
import { sanityImageSchema, portableTextSchema, slugPattern } from '@/lib/api/zod-helpers'
import { logMutation } from '@/lib/logger'
import type { ServiceDocument } from '@/types/sanity'

const updateServiceSchema = z.object({
  title: z.string().min(1).max(100),
  slug: z.string().regex(slugPattern, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  shortDescription: z.string().min(1).max(200),
  body: portableTextSchema,
  icon: z.string().max(50).optional(),
  coverImage: sanityImageSchema.optional(),
  isActive: z.boolean(),
  order: z.number().int().min(0),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  _rev: z.string(),
})

async function fetchService(id: string): Promise<ServiceDocument | null> {
  return readClient.fetch<ServiceDocument | null>('*[_id == $id][0]', { id })
}

export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const requestId = getRequestId(request)
    await requireAdmin()
    const id = await requireParam(params, 'id')

    const service = await fetchService(id)
    if (!service) {
      return errorResponse('NOT_FOUND', 'NOT_FOUND', 'Service not found', requestId, 404)
    }
    return successResponse(service, requestId)
  }
)

export const PUT = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const requestId = getRequestId(request)
    const session = await requireAdmin()
    const id = await requireParam(params, 'id')

    if (!validateCsrfToken(request, session.user.email)) {
      throw new CsrfError()
    }

    const body: unknown = await request.json()
    const parsed = updateServiceSchema.safeParse(body)

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

    const result = await executeMutation<ServiceDocument>({
      requestId,
      route: `/api/admin/services/${id}`,
      method: 'PUT',
      entityType: 'service',
      entityId: id,
      preWriteRev,
      writeOperation: async () => {
        await writeClient
          .patch(id)
          .set({
            title: fields.title,
            slug: { _type: 'slug', current: fields.slug },
            shortDescription: fields.shortDescription,
            body: fields.body,
            icon: fields.icon,
            coverImage: fields.coverImage,
            isActive: fields.isActive,
            order: fields.order,
            seoTitle: fields.seoTitle,
            seoDescription: fields.seoDescription,
            updatedAt: new Date().toISOString(),
          })
          .commit()
      },
      readBack: () => fetchService(id),
      verifyReadBack: (doc) =>
        doc._id === id &&
        doc._rev !== preWriteRev &&
        typeof doc.title === 'string' &&
        doc.title.length > 0,
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

export const DELETE = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const requestId = getRequestId(request)
    const session = await requireAdmin()
    const id = await requireParam(params, 'id')

    if (!validateCsrfToken(request, session.user.email)) {
      throw new CsrfError()
    }

    const service = await fetchService(id)
    if (!service) {
      return errorResponse('NOT_FOUND', 'NOT_FOUND', 'Service not found', requestId, 404)
    }

    const startTime = Date.now()
    await writeClient.delete(id)

    logMutation({
      level: 'info',
      type: 'mutation',
      requestId,
      route: `/api/admin/services/${id}`,
      method: 'DELETE',
      entityType: 'service',
      entityId: id,
      outcome: 'SUCCESS',
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    })

    return successResponse({ deleted: true, id }, requestId)
  }
)
