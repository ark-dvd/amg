import type { Metadata } from 'next'
import type { SiteSettingsDocument, SanityImage } from '@/types/sanity'
import { urlFor } from '@/lib/sanity/image'

const DOMAIN = process.env.NEXT_PUBLIC_CANONICAL_DOMAIN ?? 'https://amgpm.com'

export function canonicalUrl(path: string): string {
  const clean = path === '/' ? '' : path.replace(/\/+$/, '')
  return `${DOMAIN}${clean}`
}

interface BuildMetadataOptions {
  path: string
  title: string
  description?: string
  ogImage?: SanityImage | null
  siteName: string
  globalSeoDescription?: string
  globalOgImage?: SanityImage | null
  article?: {
    publishedTime?: string
    modifiedTime?: string
    author?: string
  }
  noindex?: boolean
}

export function buildMetadata(opts: BuildMetadataOptions): Metadata {
  const url = canonicalUrl(opts.path)
  const description = opts.description ?? opts.globalSeoDescription ?? ''
  const ogImageSource = opts.ogImage ?? opts.globalOgImage
  const ogImageUrl = ogImageSource ? urlFor(ogImageSource).width(1200).height(630).url() : undefined

  const metadata: Metadata = {
    title: opts.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: opts.article ? 'article' : 'website',
      url,
      title: opts.title,
      description,
      siteName: opts.siteName,
      ...(ogImageUrl ? { images: [{ url: ogImageUrl, width: 1200, height: 630 }] } : {}),
      ...(opts.article ? {
        publishedTime: opts.article.publishedTime,
        modifiedTime: opts.article.modifiedTime,
        authors: opts.article.author ? [opts.article.author] : undefined,
      } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description,
      ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
    },
  }

  if (opts.noindex) {
    metadata.robots = { index: false, follow: false }
  }

  return metadata
}

// ─── JSON-LD helpers ─────────────────────────────────────────────

export function buildOrganizationJsonLd(settings: SiteSettingsDocument) {
  const org: Record<string, unknown> = {
    '@type': 'Organization',
    name: settings.siteName,
    url: DOMAIN,
  }
  if (settings.logo) {
    org.logo = urlFor(settings.logo).width(600).url()
  }
  if (settings.contactEmail) {
    org.email = settings.contactEmail
  }
  if (settings.contactPhone) {
    org.telephone = settings.contactPhone
  }
  if (settings.contactAddress) {
    org.address = settings.contactAddress
  }
  const sameAs: string[] = []
  if (settings.linkedinUrl) sameAs.push(settings.linkedinUrl)
  if (settings.twitterUrl) sameAs.push(settings.twitterUrl)
  if (settings.facebookUrl) sameAs.push(settings.facebookUrl)
  if (settings.instagramUrl) sameAs.push(settings.instagramUrl)
  if (settings.youtubeUrl) sameAs.push(settings.youtubeUrl)
  if (sameAs.length > 0) org.sameAs = sameAs
  return org
}

export function buildWebSiteJsonLd(settings: SiteSettingsDocument) {
  return {
    '@type': 'WebSite',
    name: settings.siteName,
    url: DOMAIN,
    ...(settings.globalSeoDescription ? { description: settings.globalSeoDescription } : {}),
  }
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  }
}

export function buildJsonLdScript(blocks: Record<string, unknown>[]) {
  const graph = blocks.map((b) => ({ '@context': 'https://schema.org', ...b }))
  return graph
}
