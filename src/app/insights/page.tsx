import Image from 'next/image'
import Link from 'next/link'
import { getSiteSettings, getPublishedArticles } from '@/lib/sanity/queries'
import { urlFor } from '@/lib/sanity/image'
import { buildMetadata, buildOrganizationJsonLd, buildBreadcrumbJsonLd, buildJsonLdScript } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import type { Metadata } from 'next'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  if (!settings) return { title: 'Insights' }
  const title = settings.insights?.pageHeading
    ? `${settings.insights.pageHeading} — ${settings.siteName}`
    : `${settings.nav?.insightsLabel ?? 'Insights'} — ${settings.siteName}`
  return buildMetadata({
    path: '/insights',
    title,
    description: settings.insights?.pageSubheading ?? settings.globalSeoDescription,
    siteName: settings.siteName,
    globalSeoDescription: settings.globalSeoDescription,
    globalOgImage: settings.ogImage,
  })
}

export default async function InsightsPage() {
  const [settings, articles] = await Promise.all([
    getSiteSettings(),
    getPublishedArticles(),
  ])

  if (!settings) return null

  const jsonLd = buildJsonLdScript([
    buildOrganizationJsonLd(settings),
    buildBreadcrumbJsonLd([
      { name: settings.siteName, path: '/' },
      { name: settings.nav?.insightsLabel ?? 'Insights', path: '/insights' },
    ]),
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
        {settings.insights?.pageHeading && (
          <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-4">
            {settings.insights.pageHeading}
          </h1>
        )}
        {settings.insights?.pageSubheading && (
          <p className="text-xl text-gray-600 mb-12">{settings.insights.pageSubheading}</p>
        )}

        {articles.length === 0 ? (
          <p className="text-gray-500 text-lg">
            {settings.empty?.insightsMessage ?? ''}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link
                key={article._id}
                href={`/insights/${article.slug.current}`}
                className="group"
              >
                {article.coverImage && (
                  <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                    <Image
                      src={urlFor(article.coverImage).width(600).height(400).url()}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                  {article.category && <span>{article.category}</span>}
                  {article.publishedAt && (
                    <time dateTime={article.publishedAt}>
                      {new Date(article.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  )}
                </div>
                <h2 className="font-serif text-xl text-charcoal mb-2">{article.title}</h2>
                <p className="text-gray-600 text-sm">{article.excerpt}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
