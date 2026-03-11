import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { readClient, writeClient } from '@/lib/sanity/client'
import { requireAdmin } from '@/lib/api/auth-guard'
import { validateCsrfToken, CsrfError } from '@/lib/api/csrf'
import { checkRevConflict, getCurrentRev } from '@/lib/api/concurrency'
import { executeMutation } from '@/lib/api/mutation'
import {
  successResponse,
  uninitializedResponse,
  errorResponse,
} from '@/lib/api/response'
import { withErrorHandler, getRequestId } from '@/lib/api/route-handler'
import { sanityImageSchema, portableTextSchema } from '@/lib/api/zod-helpers'
import type { SiteSettingsDocument } from '@/types/sanity'

const SINGLETON_ID = 'singleton.siteSettings'

const siteSettingsSchema = z.object({
  // Section A: Identity
  siteName: z.string().min(1).max(100).optional(),
  tagline: z.string().max(150).optional(),
  logo: sanityImageSchema.optional(),
  favicon: sanityImageSchema.optional(),
  // Section B: Contact
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().max(30).optional(),
  contactAddress: z.string().max(300).optional(),
  // Section C: SEO
  globalSeoTitle: z.string().max(70).optional(),
  globalSeoDescription: z.string().max(160).optional(),
  ogImage: sanityImageSchema.optional(),
  // Section D: Analytics
  gaId: z
    .string()
    .regex(/^G-[A-Z0-9]+$/, 'Must match format G-XXXXXXX')
    .optional()
    .or(z.literal('')),
  // Section E: Social Links
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  facebookUrl: z.string().url().optional().or(z.literal('')),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  youtubeUrl: z.string().url().optional().or(z.literal('')),
  // Section F: Footer
  footerText: z.string().max(200).optional(),
  termsLabel: z.string().max(50).optional(),
  privacyLabel: z.string().max(50).optional(),
  accessibilityLabel: z.string().max(50).optional(),
  // Section G: Policy Pages
  termsContent: portableTextSchema.optional(),
  privacyContent: portableTextSchema.optional(),
  accessibilityContent: portableTextSchema.optional(),
  // Section H: Navigation Labels
  nav: z
    .object({
      aboutLabel: z.string().max(40).optional(),
      servicesLabel: z.string().max(40).optional(),
      portfolioLabel: z.string().max(40).optional(),
      insightsLabel: z.string().max(40).optional(),
      contactLabel: z.string().max(40).optional(),
      ctaLabel: z.string().max(40).optional(),
    })
    .optional(),
  // Section I: Homepage Labels
  home: z
    .object({
      aboutHeading: z.string().optional(),
      servicesHeading: z.string().max(80).optional(),
      servicesSubheading: z.string().max(200).optional(),
      portfolioHeading: z.string().max(80).optional(),
      portfolioSubheading: z.string().max(200).optional(),
      testimonialsHeading: z.string().max(80).optional(),
      insightsHeading: z.string().max(80).optional(),
      ctaHeading: z.string().max(120).optional(),
      ctaSubheading: z.string().max(250).optional(),
      ctaButtonLabel: z.string().max(50).optional(),
    })
    .optional(),
  // Section J: Services Page
  services: z
    .object({
      pageHeading: z.string().max(80).optional(),
      pageSubheading: z.string().max(200).optional(),
    })
    .optional(),
  // Section K: Portfolio Page
  portfolio: z
    .object({
      pageHeading: z.string().optional(),
      pageSubheading: z.string().max(200).optional(),
      testimonialsHeading: z.string().optional(),
    })
    .optional(),
  // Section L: Insights Page
  insights: z
    .object({
      pageHeading: z.string().max(80).optional(),
      pageSubheading: z.string().max(200).optional(),
    })
    .optional(),
  // Section M: Contact Page
  contact: z
    .object({
      pageHeading: z.string().max(80).optional(),
      pageSubheading: z.string().max(200).optional(),
      formNameLabel: z.string().max(60).optional(),
      formEmailLabel: z.string().max(60).optional(),
      formPhoneLabel: z.string().max(60).optional(),
      formCompanyLabel: z.string().max(60).optional(),
      formMessageLabel: z.string().max(60).optional(),
      formSubmitLabel: z.string().max(50).optional(),
      formSuccessMessage: z.string().max(300).optional(),
      formErrorMessage: z.string().max(300).optional(),
    })
    .optional(),
  // Section N: Empty States
  empty: z
    .object({
      servicesMessage: z.string().max(200).optional(),
      portfolioMessage: z.string().max(200).optional(),
      insightsMessage: z.string().max(200).optional(),
    })
    .optional(),
  // Section O: 404 & Error Page
  error404: z
    .object({
      heading: z.string().max(80).optional(),
      message: z.string().max(300).optional(),
      ctaLabel: z.string().max(50).optional(),
    })
    .optional(),
  // Concurrency
  _rev: z.string().optional(),
})

async function fetchSettings(): Promise<SiteSettingsDocument | null> {
  return readClient.fetch<SiteSettingsDocument | null>('*[_id == $id][0]', {
    id: SINGLETON_ID,
  })
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request)
  await requireAdmin()

  const settings = await fetchSettings()
  if (!settings) {
    return uninitializedResponse(requestId)
  }
  return successResponse(settings, requestId)
})

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request)
  const session = await requireAdmin()

  if (!validateCsrfToken(request, session.user.email)) {
    throw new CsrfError()
  }

  const body: unknown = await request.json()
  const parsed = siteSettingsSchema.safeParse(body)

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

  if (data._rev) {
    const conflict = await checkRevConflict(SINGLETON_ID, data._rev)
    if (conflict) {
      return errorResponse(
        'CONFLICT',
        'CONFLICT',
        'Document has been modified by another user. Please reload and try again.',
        requestId,
        409
      )
    }
  }

  const preWriteRev = await getCurrentRev(SINGLETON_ID)
  const { _rev: _submittedRev, ...fields } = data

  const result = await executeMutation<SiteSettingsDocument>({
    requestId,
    route: '/api/admin/site-settings',
    method: 'PUT',
    entityType: 'siteSettings',
    entityId: SINGLETON_ID,
    preWriteRev,
    writeOperation: async () => {
      await writeClient
        .patch(SINGLETON_ID)
        .set({ ...fields, updatedAt: new Date().toISOString() })
        .commit()
    },
    readBack: fetchSettings,
    verifyReadBack: (doc) =>
      doc._id === SINGLETON_ID &&
      doc._rev !== preWriteRev,
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

  revalidatePath('/', 'layout')

  return successResponse(result.data, requestId)
})
