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
import { sanityImageSchema, portableTextSchema, slugPattern } from '@/lib/api/zod-helpers'
import { logMutation } from '@/lib/logger'
import type { ProjectDocument } from '@/types/sanity'

const updateProjectSchema = z.object({
  title: z.string().min(1).max(150),
  slug: z.string().regex(slugPattern, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  clientName: z.string().max(150).optional(),
  shortDescription: z.string().min(1).max(250),
  body: portableTextSchema,
  projectType: z.string().max(80).optional(),
  technologies: z.array(z.string().max(50)).min(1).max(20).optional(),
  coverImage: sanityImageSchema,
  screenshots: z.array(sanityImageSchema).max(20).optional(),
  completedAt: z.string().optional(),
  isActive: z.boolean(),
  featuredOnHomepage: z.boolean().default(false),
  order: z.number().int().min(0),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  _rev: z.string(),
})

async function fetchProject(id: string): Promise<ProjectDocument | null> {
  return writeClient.fetch<ProjectDocument | null>('*[_id == $id][0]', { id })
}

export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const requestId = getRequestId(request)
    await requireAdmin()
    const id = await requireParam(params, 'id')

    const project = await fetchProject(id)
    if (!project) {
      return errorResponse('NOT_FOUND', 'NOT_FOUND', 'Project not found', requestId, 404)
    }
    return successResponse(project, requestId)
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
    const parsed = updateProjectSchema.safeParse(body)

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

    const result = await executeMutation<ProjectDocument>({
      requestId,
      route: `/api/admin/projects/${id}`,
      method: 'PUT',
      entityType: 'project',
      entityId: id,
      preWriteRev,
      writeOperation: async () => {
        await writeClient
          .patch(id)
          .set({
            title: fields.title,
            slug: { _type: 'slug', current: fields.slug },
            clientName: fields.clientName,
            shortDescription: fields.shortDescription,
            body: fields.body,
            projectType: fields.projectType,
            technologies: fields.technologies,
            coverImage: fields.coverImage,
            screenshots: fields.screenshots,
            completedAt: fields.completedAt,
            isActive: fields.isActive,
            featuredOnHomepage: fields.featuredOnHomepage,
            order: fields.order,
            seoTitle: fields.seoTitle,
            seoDescription: fields.seoDescription,
            updatedAt: new Date().toISOString(),
          })
          .commit()
      },
      readBack: () => fetchProject(id),
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

    const project = await fetchProject(id)
    if (!project) {
      return errorResponse('NOT_FOUND', 'NOT_FOUND', 'Project not found', requestId, 404)
    }

    if (!project.isArchived) {
      return errorResponse(
        'CONFLICT',
        'ARCHIVE_REQUIRED',
        'Project must be archived before permanent deletion',
        requestId,
        409
      )
    }

    const startTime = Date.now()

    const testimonials = await readClient.fetch<{ _id: string }[]>(
      '*[_type == "testimonial" && projectRef._ref == $projectId]{ _id }',
      { projectId: id }
    )

    let transaction = writeClient.transaction()
    for (const t of testimonials) {
      transaction = transaction.delete(t._id)
    }
    transaction = transaction.delete(id)
    await transaction.commit()

    logMutation({
      level: 'info',
      type: 'mutation',
      requestId,
      route: `/api/admin/projects/${id}`,
      method: 'DELETE',
      entityType: 'project',
      entityId: id,
      outcome: 'SUCCESS',
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/')
    revalidatePath('/portfolio')
    revalidatePath('/portfolio/[slug]', 'page')

    return successResponse(
      { deleted: true, id, testimonialsDeleted: testimonials.length },
      requestId
    )
  }
)
