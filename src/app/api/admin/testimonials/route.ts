import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { readClient, writeClient } from '@/lib/sanity/client'
import { requireAdmin } from '@/lib/api/auth-guard'
import { validateCsrfToken, CsrfError } from '@/lib/api/csrf'
import { executeMutation } from '@/lib/api/mutation'
import { successResponse, listResponse, errorResponse } from '@/lib/api/response'
import { withErrorHandler, getRequestId } from '@/lib/api/route-handler'
import { sanityImageSchema } from '@/lib/api/zod-helpers'
import type { TestimonialDocument } from '@/types/sanity'

const createTestimonialSchema = z.object({
  authorName: z.string().min(1).max(100),
  authorRole: z.string().max(100).optional(),
  authorCompany: z.string().max(100).optional(),
  authorPhoto: sanityImageSchema.optional(),
  quote: z.string().min(1).max(600),
  projectRef: z.object({
    _type: z.literal('reference'),
    _ref: z.string(),
  }),
  featuredOnPortfolio: z.boolean().default(false),
  order: z.number().int().min(0),
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request)
  await requireAdmin()

  const archived = request.nextUrl.searchParams.get('archived') === 'true'
  const projectId = request.nextUrl.searchParams.get('projectId')

  let query: string
  const params: Record<string, unknown> = {}

  if (archived) {
    query = projectId
      ? '*[_type == "testimonial" && isArchived == true && projectRef._ref == $projectId] | order(order asc)'
      : '*[_type == "testimonial" && isArchived == true] | order(order asc)'
  } else {
    query = projectId
      ? '*[_type == "testimonial" && isArchived == false && projectRef._ref == $projectId] | order(order asc)'
      : '*[_type == "testimonial" && isArchived == false] | order(order asc)'
  }

  if (projectId) {
    params.projectId = projectId
  }

  const testimonials = await readClient.fetch<TestimonialDocument[]>(query, params)
  return listResponse(testimonials, testimonials.length, requestId)
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request)
  const session = await requireAdmin()

  if (!validateCsrfToken(request, session.user.email)) {
    throw new CsrfError()
  }

  const body: unknown = await request.json()
  const parsed = createTestimonialSchema.safeParse(body)

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

  const project = await readClient.fetch<{ _id: string; isArchived: boolean } | null>(
    '*[_type == "project" && _id == $id][0]{ _id, isArchived }',
    { id: data.projectRef._ref }
  )

  if (!project) {
    return errorResponse(
      'VALIDATION',
      'VALIDATION_FAILED',
      'Referenced project does not exist',
      requestId,
      400,
      { fieldErrors: { 'projectRef._ref': 'Project not found' } }
    )
  }

  if (project.isArchived) {
    return errorResponse(
      'VALIDATION',
      'VALIDATION_FAILED',
      'Cannot add testimonial to an archived project',
      requestId,
      400,
      { fieldErrors: { 'projectRef._ref': 'Project is archived' } }
    )
  }

  const now = new Date().toISOString()
  let createdId = ''

  const result = await executeMutation<TestimonialDocument>({
    requestId,
    route: '/api/admin/testimonials',
    method: 'POST',
    entityType: 'testimonial',
    entityId: 'pending',
    preWriteRev: null,
    writeOperation: async () => {
      const doc = await writeClient.create({
        _type: 'testimonial',
        authorName: data.authorName,
        authorRole: data.authorRole,
        authorCompany: data.authorCompany,
        authorPhoto: data.authorPhoto,
        quote: data.quote,
        projectRef: data.projectRef,
        featuredOnPortfolio: data.featuredOnPortfolio,
        order: data.order,
        isArchived: false,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      })
      createdId = doc._id
    },
    readBack: async () => {
      if (!createdId) return null
      return readClient.fetch<TestimonialDocument | null>('*[_id == $id][0]', {
        id: createdId,
      })
    },
    verifyReadBack: (doc) =>
      typeof doc._id === 'string' &&
      typeof doc._rev === 'string' &&
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

  return successResponse(result.data, requestId)
})
