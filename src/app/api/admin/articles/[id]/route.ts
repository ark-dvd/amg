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
import type { ArticleDocument } from '@/types/sanity'

const updateArticleSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().regex(slugPattern, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  excerpt: z.string().min(1).max(300),
  body: portableTextSchema,
  coverImage: sanityImageSchema.optional(),
  category: z.string().max(80).optional(),
  tags: z.array(z.string()).max(10).optional(),
  authorName: z.string().max(100).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  _rev: z.string(),
})

async function fetchArticle(id: string): Promise<ArticleDocument | null> {
  return readClient.fetch<ArticleDocument | null>('*[_id == $id][0]', { id })
}

export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const requestId = getRequestId(request)
    await requireAdmin()
    const id = await requireParam(params, 'id')

    const article = await fetchArticle(id)
    if (!article) {
      return errorResponse('NOT_FOUND', 'NOT_FOUND', 'Article not found', requestId, 404)
    }
    return successResponse(article, requestId)
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
    const parsed = updateArticleSchema.safeParse(body)

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

    const result = await executeMutation<ArticleDocument>({
      requestId,
      route: `/api/admin/articles/${id}`,
      method: 'PUT',
      entityType: 'article',
      entityId: id,
      preWriteRev,
      writeOperation: async () => {
        await writeClient
          .patch(id)
          .set({
            title: fields.title,
            slug: { _type: 'slug', current: fields.slug },
            excerpt: fields.excerpt,
            body: fields.body,
            coverImage: fields.coverImage,
            category: fields.category,
            tags: fields.tags,
            authorName: fields.authorName,
            seoTitle: fields.seoTitle,
            seoDescription: fields.seoDescription,
            updatedAt: new Date().toISOString(),
          })
          .commit()
      },
      readBack: () => fetchArticle(id),
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
    revalidatePath('/insights')
    revalidatePath('/insights/[slug]', 'page')

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

    const article = await fetchArticle(id)
    if (!article) {
      return errorResponse('NOT_FOUND', 'NOT_FOUND', 'Article not found', requestId, 404)
    }

    const startTime = Date.now()
    await writeClient.delete(id)

    logMutation({
      level: 'info',
      type: 'mutation',
      requestId,
      route: `/api/admin/articles/${id}`,
      method: 'DELETE',
      entityType: 'article',
      entityId: id,
      outcome: 'SUCCESS',
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/')
    revalidatePath('/insights')
    revalidatePath('/insights/[slug]', 'page')

    return successResponse({ deleted: true, id }, requestId)
  }
)
