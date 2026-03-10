import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { writeClient } from '@/lib/sanity/client'
import { requireAdmin } from '@/lib/api/auth-guard'
import { validateCsrfToken, CsrfError } from '@/lib/api/csrf'
import { successResponse, errorResponse } from '@/lib/api/response'
import { withErrorHandler, getRequestId } from '@/lib/api/route-handler'
import { logMutation } from '@/lib/logger'

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().min(0),
    })
  ),
})

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request)
  const session = await requireAdmin()

  if (!validateCsrfToken(request, session.user.email)) {
    throw new CsrfError()
  }

  const body: unknown = await request.json()
  const parsed = reorderSchema.safeParse(body)

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

  const { items } = parsed.data
  const startTime = Date.now()

  let transaction = writeClient.transaction()
  for (const item of items) {
    transaction = transaction.patch(item.id, (patch) =>
      patch.set({ order: item.order, updatedAt: new Date().toISOString() })
    )
  }
  await transaction.commit()

  logMutation({
    level: 'info',
    type: 'mutation',
    requestId,
    route: '/api/admin/services/reorder',
    method: 'PATCH',
    entityType: 'service',
    entityId: 'batch',
    outcome: 'SUCCESS',
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/')
  revalidatePath('/services')

  return successResponse({ reordered: true, count: items.length }, requestId)
})
