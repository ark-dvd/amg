import { getSiteSettings } from '@/lib/sanity/queries'
import { buildMetadata, buildOrganizationJsonLd, buildBreadcrumbJsonLd, buildJsonLdScript } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  if (!settings) return { title: 'Accessibility' }
  return buildMetadata({
    path: '/accessibility',
    title: `${settings.accessibilityLabel ?? 'Accessibility'} — ${settings.siteName}`,
    siteName: settings.siteName,
    globalSeoDescription: settings.globalSeoDescription,
    globalOgImage: settings.ogImage,
  })
}

export default async function AccessibilityPage() {
  const settings = await getSiteSettings()
  if (!settings) return notFound()

  const jsonLd = buildJsonLdScript([
    buildOrganizationJsonLd(settings),
    buildBreadcrumbJsonLd([
      { name: settings.siteName, path: '/' },
      { name: settings.accessibilityLabel ?? 'Accessibility', path: '/accessibility' },
    ]),
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-4xl px-4 py-20 sm:py-28">
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-12">
          {settings.accessibilityLabel ?? 'Accessibility'}
        </h1>
        {settings.accessibilityContent ? (
          <PortableTextRenderer value={settings.accessibilityContent} />
        ) : null}
      </div>
    </>
  )
}
