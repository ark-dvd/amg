import Image from 'next/image'
import Link from 'next/link'
import { getSiteSettings, getActiveProjects, getFeaturedTestimonials } from '@/lib/sanity/queries'
import { urlFor } from '@/lib/sanity/image'
import { buildMetadata, buildOrganizationJsonLd, buildBreadcrumbJsonLd, buildJsonLdScript } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import type { Metadata } from 'next'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  if (!settings) return { title: 'Portfolio' }
  const title = settings.portfolio?.pageHeading
    ? `${settings.portfolio.pageHeading} — ${settings.siteName}`
    : `${settings.nav?.portfolioLabel ?? 'Portfolio'} — ${settings.siteName}`
  return buildMetadata({
    path: '/portfolio',
    title,
    description: settings.portfolio?.pageSubheading ?? settings.globalSeoDescription,
    siteName: settings.siteName,
    globalSeoDescription: settings.globalSeoDescription,
    globalOgImage: settings.ogImage,
  })
}

export default async function PortfolioPage() {
  const [settings, projects, testimonials] = await Promise.all([
    getSiteSettings(),
    getActiveProjects(),
    getFeaturedTestimonials(),
  ])

  if (!settings) return null

  const jsonLd = buildJsonLdScript([
    buildOrganizationJsonLd(settings),
    buildBreadcrumbJsonLd([
      { name: settings.siteName, path: '/' },
      { name: settings.nav?.portfolioLabel ?? 'Portfolio', path: '/portfolio' },
    ]),
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
        {settings.portfolio?.pageHeading && (
          <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-4">
            {settings.portfolio.pageHeading}
          </h1>
        )}
        {settings.portfolio?.pageSubheading && (
          <p className="text-xl text-gray-600 mb-12">{settings.portfolio.pageSubheading}</p>
        )}

        {projects.length === 0 ? (
          <p className="text-gray-500 text-lg">
            {settings.empty?.portfolioMessage ?? ''}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <Link
                key={project._id}
                href={`/portfolio/${project.slug.current}`}
                className="group"
              >
                {project.coverImage && (
                  <div className="relative h-64 rounded-lg overflow-hidden mb-4">
                    <Image
                      src={urlFor(project.coverImage).width(600).height(400).url()}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                <h2 className="font-serif text-xl text-charcoal mb-1">{project.title}</h2>
                {project.clientName && (
                  <p className="text-sm text-gray-500">{project.clientName}</p>
                )}
                <p className="text-gray-600 text-sm mt-2">{project.shortDescription}</p>
              </Link>
            ))}
          </div>
        )}

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <section className="mt-20">
            {settings.portfolio?.testimonialsHeading && (
              <h2 className="font-serif text-3xl text-charcoal mb-8">
                {settings.portfolio.testimonialsHeading}
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((t) => (
                <blockquote key={t._id} className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700 italic mb-4">&ldquo;{t.quote}&rdquo;</p>
                  <footer className="flex items-center gap-3">
                    {t.authorPhoto && (
                      <Image
                        src={urlFor(t.authorPhoto).width(80).height(80).url()}
                        alt={t.authorName}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium text-charcoal text-sm">{t.authorName}</p>
                      {t.authorRole && (
                        <p className="text-xs text-gray-500">
                          {t.authorRole}
                          {t.authorCompany ? `, ${t.authorCompany}` : ''}
                        </p>
                      )}
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
