import { NextRequest } from 'next/server'
import { z } from 'zod'
import { readClient, writeClient } from '@/lib/sanity/client'
import { requireAdmin } from '@/lib/api/auth-guard'
import { validateCsrfToken, CsrfError } from '@/lib/api/csrf'
import { executeMutation } from '@/lib/api/mutation'
import { successResponse, listResponse, errorResponse } from '@/lib/api/response'
import { withErrorHandler, getRequestId } from '@/lib/api/route-handler'
import { sanityImageSchema, portableTextSchema, slugPattern } from '@/lib/api/zod-helpers'
import type { ServiceDocument } from '@/types/sanity'

const createServiceSchema = z.object({
  title: z.string().min(1).max(100),
  slug: z.string().regex(slugPattern, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  shortDescription: z.string().min(1).max(200),
  body: portableTextSchema,
  icon: z.string().max(50).optional(),
  coverImage: sanityImageSchema.optional(),
  isActive: z.boolean().default(false),
  order: z.number().int().min(0),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request)
  await requireAdmin()

  const services = await readClient.fetch<ServiceDocument[]>(
    '*[_type == "service"] | order(order asc)'
  )

  return listResponse(services, services.length, requestId)
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request)
  const session = await requireAdmin()

  if (!validateCsrfToken(request, session.user.email)) {
    throw new CsrfError()
  }

  const body: unknown = await request.json()
  const parsed = createServiceSchema.safeParse(body)

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

  const existing = await readClient.fetch<{ _id: string } | null>(
    '*[_type == "service" && slug.current == $slug][0]{ _id }',
    { slug: data.slug }
  )
  if (existing) {
    return errorResponse(
      'VALIDATION',
      'SLUG_CONFLICT',
      'A service with this slug already exists',
      requestId,
      400
    )
  }

  const now = new Date().toISOString()
  let createdId = ''

  const result = await executeMutation<ServiceDocument>({
    requestId,
    route: '/api/admin/services',
    method: 'POST',
    entityType: 'service',
    entityId: 'pending',
    preWriteRev: null,
    writeOperation: async () => {
      const doc = await writeClient.create({
        _type: 'service',
        title: data.title,
        slug: { _type: 'slug', current: data.slug },
        shortDescription: data.shortDescription,
        body: data.body,
        icon: data.icon,
        coverImage: data.coverImage,
        isActive: data.isActive,
        order: data.order,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        createdAt: now,
        updatedAt: now,
      })
      createdId = doc._id
    },
    readBack: async () => {
      if (!createdId) return null
      return readClient.fetch<ServiceDocument | null>('*[_id == $id][0]', {
        id: createdId,
      })
    },
    verifyReadBack: (doc) =>
      typeof doc._id === 'string' &&
      typeof doc._rev === 'string' &&
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
})
