import { getSiteSettings } from '@/lib/sanity/queries'
import { buildMetadata, buildOrganizationJsonLd, buildBreadcrumbJsonLd, buildJsonLdScript } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  if (!settings) return { title: 'Privacy Policy' }
  return buildMetadata({
    path: '/privacy',
    title: `${settings.privacyLabel ?? 'Privacy Policy'} — ${settings.siteName}`,
    siteName: settings.siteName,
    globalSeoDescription: settings.globalSeoDescription,
    globalOgImage: settings.ogImage,
  })
}

export default async function PrivacyPage() {
  const settings = await getSiteSettings()
  if (!settings) return notFound()

  const jsonLd = buildJsonLdScript([
    buildOrganizationJsonLd(settings),
    buildBreadcrumbJsonLd([
      { name: settings.siteName, path: '/' },
      { name: settings.privacyLabel ?? 'Privacy Policy', path: '/privacy' },
    ]),
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-4xl px-4 py-20 sm:py-28">
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-12">
          {settings.privacyLabel ?? 'Privacy Policy'}
        </h1>
        {settings.privacyContent ? (
          <PortableTextRenderer value={settings.privacyContent} />
        ) : null}
      </div>
    </>
  )
}
