import { getSiteSettings } from '@/lib/sanity/queries'
import { buildMetadata, buildOrganizationJsonLd, buildBreadcrumbJsonLd, buildJsonLdScript } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  if (!settings) return { title: 'Terms of Use' }
  return buildMetadata({
    path: '/terms',
    title: `${settings.termsLabel ?? 'Terms of Use'} — ${settings.siteName}`,
    siteName: settings.siteName,
    globalSeoDescription: settings.globalSeoDescription,
    globalOgImage: settings.ogImage,
  })
}

export default async function TermsPage() {
  const settings = await getSiteSettings()
  if (!settings) return notFound()

  const jsonLd = buildJsonLdScript([
    buildOrganizationJsonLd(settings),
    buildBreadcrumbJsonLd([
      { name: settings.siteName, path: '/' },
      { name: settings.termsLabel ?? 'Terms of Use', path: '/terms' },
    ]),
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-12">
          {settings.termsLabel ?? 'Terms of Use'}
        </h1>
        {settings.termsContent ? (
          <PortableTextRenderer value={settings.termsContent} />
        ) : null}
      </div>
    </>
  )
}
