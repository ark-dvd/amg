import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getSiteSettings, getServiceBySlug, getAllServiceSlugs } from '@/lib/sanity/queries'
import { urlFor } from '@/lib/sanity/image'
import { buildMetadata, buildOrganizationJsonLd, buildBreadcrumbJsonLd, buildJsonLdScript, canonicalUrl } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import type { Metadata } from 'next'

export const revalidate = 300

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getAllServiceSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [settings, service] = await Promise.all([
    getSiteSettings(),
    getServiceBySlug(slug),
  ])
  if (!settings || !service) return { title: 'Service Not Found' }
  return buildMetadata({
    path: `/services/${slug}`,
    title: service.seoTitle ?? `${service.title} — ${settings.siteName}`,
    description: service.seoDescription ?? service.shortDescription ?? settings.globalSeoDescription,
    ogImage: service.coverImage,
    siteName: settings.siteName,
    globalSeoDescription: settings.globalSeoDescription,
    globalOgImage: settings.ogImage,
  })
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params
  const [settings, service] = await Promise.all([
    getSiteSettings(),
    getServiceBySlug(slug),
  ])

  if (!service) return notFound()
  if (!settings) return null

  const jsonLd = buildJsonLdScript([
    buildOrganizationJsonLd(settings),
    {
      '@type': 'Service',
      name: service.title,
      description: service.shortDescription,
      provider: {
        '@type': 'Organization',
        name: settings.siteName,
      },
      url: canonicalUrl(`/services/${slug}`),
    },
    buildBreadcrumbJsonLd([
      { name: settings.siteName, path: '/' },
      { name: settings.nav?.servicesLabel ?? 'Services', path: '/services' },
      { name: service.title, path: `/services/${slug}` },
    ]),
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <article className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-4">{service.title}</h1>
        <p className="text-xl text-gray-600 mb-8">{service.shortDescription}</p>

        {service.coverImage && (
          <div className="relative h-64 sm:h-96 rounded-lg overflow-hidden mb-12">
            <Image
              src={urlFor(service.coverImage).width(1200).height(600).url()}
              alt={service.title}
              fill
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
            />
          </div>
        )}

        {service.body && <PortableTextRenderer value={service.body} />}
      </article>
    </>
  )
}
