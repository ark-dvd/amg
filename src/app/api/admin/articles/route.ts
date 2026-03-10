import { NextRequest } from 'next/server'
import { z } from 'zod'
import { readClient, writeClient } from '@/lib/sanity/client'
import { requireAdmin } from '@/lib/api/auth-guard'
import { validateCsrfToken, CsrfError } from '@/lib/api/csrf'
import { executeMutation } from '@/lib/api/mutation'
import { successResponse, listResponse, errorResponse } from '@/lib/api/response'
import { withErrorHandler, getRequestId } from '@/lib/api/route-handler'
import { sanityImageSchema, portableTextSchema, slugPattern } from '@/lib/api/zod-helpers'
import type { ArticleDocument } from '@/types/sanity'

const createArticleSchema = z.object({
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
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request)
  await requireAdmin()

  const status = request.nextUrl.searchParams.get('status')

  let query: string
  if (status === 'draft') {
    query = '*[_type == "article" && isDraft == true] | order(createdAt desc)'
  } else if (status === 'published') {
    query = '*[_type == "article" && isPublished == true] | order(createdAt desc)'
  } else {
    query = '*[_type == "article"] | order(createdAt desc)'
  }

  const articles = await readClient.fetch<ArticleDocument[]>(query)
  return listResponse(articles, articles.length, requestId)
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request)
  const session = await requireAdmin()

  if (!validateCsrfToken(request, session.user.email)) {
    throw new CsrfError()
  }

  const body: unknown = await request.json()
  const parsed = createArticleSchema.safeParse(body)

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
    '*[_type == "article" && slug.current == $slug][0]{ _id }',
    { slug: data.slug }
  )
  if (existing) {
    return errorResponse(
      'VALIDATION',
      'SLUG_CONFLICT',
      'An article with this slug already exists',
      requestId,
      400
    )
  }

  const now = new Date().toISOString()
  let createdId = ''

  const result = await executeMutation<ArticleDocument>({
    requestId,
    route: '/api/admin/articles',
    method: 'POST',
    entityType: 'article',
    entityId: 'pending',
    preWriteRev: null,
    writeOperation: async () => {
      const doc = await writeClient.create({
        _type: 'article',
        title: data.title,
        slug: { _type: 'slug', current: data.slug },
        excerpt: data.excerpt,
        body: data.body,
        coverImage: data.coverImage,
        category: data.category,
        tags: data.tags,
        authorName: data.authorName,
        isDraft: true,
        isPublished: false,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        createdAt: now,
        updatedAt: now,
      })
      createdId = doc._id
    },
    readBack: async () => {
      if (!createdId) return null
      return readClient.fetch<ArticleDocument | null>('*[_id == $id][0]', {
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
