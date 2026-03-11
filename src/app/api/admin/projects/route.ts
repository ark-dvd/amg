import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { readClient, writeClient } from '@/lib/sanity/client'
import { requireAdmin } from '@/lib/api/auth-guard'
import { validateCsrfToken, CsrfError } from '@/lib/api/csrf'
import { executeMutation } from '@/lib/api/mutation'
import { successResponse, listResponse, errorResponse } from '@/lib/api/response'
import { withErrorHandler, getRequestId } from '@/lib/api/route-handler'
import { sanityImageSchema, portableTextSchema, slugPattern } from '@/lib/api/zod-helpers'
import type { ProjectDocument } from '@/types/sanity'

const createProjectSchema = z.object({
  title: z.string().min(1).max(150),
  slug: z.string().regex(slugPattern, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  clientName: z.string().max(150).optional(),
  shortDescription: z.string().min(1).max(250),
  body: portableTextSchema,
  projectType: z.string().max(80).optional(),
  technologies: z
    .array(z.string().max(50))
    .min(1)
    .max(20)
    .optional(),
  coverImage: sanityImageSchema,
  screenshots: z.array(sanityImageSchema).max(20).optional(),
  completedAt: z.string().optional(),
  isActive: z.boolean().default(false),
  featuredOnHomepage: z.boolean().default(false),
  order: z.number().int().min(0),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request)
  await requireAdmin()

  const archived = request.nextUrl.searchParams.get('archived') === 'true'

  const query = archived
    ? '*[_type == "project" && isArchived == true] | order(archivedAt desc)'
    : '*[_type == "project" && isArchived == false] | order(order asc)'

  const projects = await readClient.fetch<ProjectDocument[]>(query)

  return listResponse(projects, projects.length, requestId)
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request)
  const session = await requireAdmin()

  if (!validateCsrfToken(request, session.user.email)) {
    throw new CsrfError()
  }

  const body: unknown = await request.json()
  const parsed = createProjectSchema.safeParse(body)

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
    '*[_type == "project" && slug.current == $slug][0]{ _id }',
    { slug: data.slug }
  )
  if (existing) {
    return errorResponse(
      'VALIDATION',
      'SLUG_CONFLICT',
      'A project with this slug already exists',
      requestId,
      400
    )
  }

  const now = new Date().toISOString()
  let createdId = ''

  const result = await executeMutation<ProjectDocument>({
    requestId,
    route: '/api/admin/projects',
    method: 'POST',
    entityType: 'project',
    entityId: 'pending',
    preWriteRev: null,
    writeOperation: async () => {
      const doc = await writeClient.create({
        _type: 'project',
        title: data.title,
        slug: { _type: 'slug', current: data.slug },
        clientName: data.clientName,
        shortDescription: data.shortDescription,
        body: data.body,
        projectType: data.projectType,
        technologies: data.technologies,
        coverImage: data.coverImage,
        screenshots: data.screenshots,
        completedAt: data.completedAt,
        isActive: data.isActive,
        featuredOnHomepage: data.featuredOnHomepage,
        order: data.order,
        isArchived: false,
        archivedAt: null,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        createdAt: now,
        updatedAt: now,
      })
      createdId = doc._id
    },
    readBack: async () => {
      if (!createdId) return null
      return writeClient.fetch<ProjectDocument | null>('*[_id == $id][0]', {
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

  revalidatePath('/')
  revalidatePath('/portfolio')

  return successResponse(result.data, requestId)
})
