import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getSiteSettings, getArticleBySlug, getAllArticleSlugs } from '@/lib/sanity/queries'
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
  const slugs = await getAllArticleSlugs()
  return slugs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [settings, article] = await Promise.all([
    getSiteSettings(),
    getArticleBySlug(slug),
  ])
  if (!settings || !article) return { title: 'Article Not Found' }
  return buildMetadata({
    path: `/insights/${slug}`,
    title: article.seoTitle ?? `${article.title} — ${settings.siteName}`,
    description: article.seoDescription ?? article.excerpt ?? settings.globalSeoDescription,
    ogImage: article.coverImage,
    siteName: settings.siteName,
    globalSeoDescription: settings.globalSeoDescription,
    globalOgImage: settings.ogImage,
    article: {
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      author: article.authorName,
    },
  })
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params
  const [settings, article] = await Promise.all([
    getSiteSettings(),
    getArticleBySlug(slug),
  ])

  if (!article) return notFound()
  if (!settings) return null

  const jsonLd = buildJsonLdScript([
    buildOrganizationJsonLd(settings),
    {
      '@type': 'Article',
      headline: article.title,
      description: article.excerpt,
      url: canonicalUrl(`/insights/${slug}`),
      ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
      ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
      ...(article.authorName ? {
        author: { '@type': 'Person', name: article.authorName },
      } : {}),
      ...(article.coverImage ? {
        image: urlFor(article.coverImage).width(1200).height(630).url(),
      } : {}),
      publisher: {
        '@type': 'Organization',
        name: settings.siteName,
        ...(settings.logo ? { logo: urlFor(settings.logo).width(600).url() } : {}),
      },
    },
    buildBreadcrumbJsonLd([
      { name: settings.siteName, path: '/' },
      { name: settings.nav?.insightsLabel ?? 'Insights', path: '/insights' },
      { name: article.title, path: `/insights/${slug}` },
    ]),
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <article className="mx-auto max-w-4xl px-4 pt-32 pb-20 sm:pt-36 sm:pb-28">
        <header className="mb-12">
          <div className="flex items-center gap-3 text-sm text-muted mb-4">
            {article.category && <span className="text-xs font-medium uppercase tracking-widest text-gold">{article.category}</span>}
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
          <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-4">{article.title}</h1>
          <p className="text-xl text-muted mb-4">{article.excerpt}</p>
          {article.authorName && (
            <p className="text-sm text-muted">{article.authorName}</p>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {article.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 border border-border text-muted text-sm rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {article.coverImage && (
          <div className="relative h-64 sm:h-96 rounded-lg overflow-hidden mb-12 border border-border">
            <Image
              src={urlFor(article.coverImage).width(1200).height(600).url()}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
          </div>
        )}

        {article.body && <PortableTextRenderer value={article.body} />}
      </article>
    </>
  )
}
