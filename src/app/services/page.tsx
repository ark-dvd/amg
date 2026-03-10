import Image from 'next/image'
import Link from 'next/link'
import { getSiteSettings, getActiveServices } from '@/lib/sanity/queries'
import { urlFor } from '@/lib/sanity/image'
import { buildMetadata, buildOrganizationJsonLd, buildBreadcrumbJsonLd, buildJsonLdScript } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import type { Metadata } from 'next'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  if (!settings) return { title: 'Services' }
  const title = settings.services?.pageHeading
    ? `${settings.services.pageHeading} — ${settings.siteName}`
    : `${settings.nav?.servicesLabel ?? 'Services'} — ${settings.siteName}`
  return buildMetadata({
    path: '/services',
    title,
    description: settings.services?.pageSubheading ?? settings.globalSeoDescription,
    siteName: settings.siteName,
    globalSeoDescription: settings.globalSeoDescription,
    globalOgImage: settings.ogImage,
  })
}

export default async function ServicesPage() {
  const [settings, services] = await Promise.all([
    getSiteSettings(),
    getActiveServices(),
  ])

  if (!settings) return null

  const jsonLd = buildJsonLdScript([
    buildOrganizationJsonLd(settings),
    buildBreadcrumbJsonLd([
      { name: settings.siteName, path: '/' },
      { name: settings.nav?.servicesLabel ?? 'Services', path: '/services' },
    ]),
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
        {settings.services?.pageHeading && (
          <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-4">
            {settings.services.pageHeading}
          </h1>
        )}
        {settings.services?.pageSubheading && (
          <p className="text-xl text-gray-600 mb-12">{settings.services.pageSubheading}</p>
        )}

        {services.length === 0 ? (
          <p className="text-gray-500 text-lg">
            {settings.empty?.servicesMessage ?? ''}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <Link
                key={service._id}
                href={`/services/${service.slug.current}`}
                className="group bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {service.coverImage && (
                  <div className="relative h-48">
                    <Image
                      src={urlFor(service.coverImage).width(600).height(400).url()}
                      alt={service.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h2 className="font-serif text-xl text-charcoal mb-2">{service.title}</h2>
                  <p className="text-gray-600 text-sm">{service.shortDescription}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
