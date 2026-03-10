import Image from 'next/image'
import Link from 'next/link'
import { getSiteSettings, getHero, getAbout, getActiveServices, getFeaturedProjects, getFeaturedTestimonials, getPublishedArticles } from '@/lib/sanity/queries'
import { urlFor } from '@/lib/sanity/image'
import { buildMetadata, buildOrganizationJsonLd, buildWebSiteJsonLd, buildJsonLdScript } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import type { Metadata } from 'next'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  if (!settings) return { title: 'AMG' }
  return buildMetadata({
    path: '/',
    title: settings.globalSeoTitle ?? settings.siteName,
    description: settings.globalSeoDescription,
    siteName: settings.siteName,
    globalOgImage: settings.ogImage,
  })
}

export default async function HomePage() {
  const [settings, hero, about, services, projects, testimonials, articles] = await Promise.all([
    getSiteSettings(),
    getHero(),
    getAbout(),
    getActiveServices(),
    getFeaturedProjects(),
    getFeaturedTestimonials(),
    getPublishedArticles(),
  ])

  if (!settings) return null

  const jsonLd = buildJsonLdScript([
    buildOrganizationJsonLd(settings),
    buildWebSiteJsonLd(settings),
  ])

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Hero Section */}
      {hero && (
        <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
          {hero.mediaType === 'video' && hero.videoUrl ? (
            <>
              {hero.videoPoster && (
                <Image
                  src={urlFor(hero.videoPoster).width(1920).height(1080).url()}
                  alt={hero.headline}
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                />
              )}
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                poster={hero.videoPoster ? urlFor(hero.videoPoster).width(1920).height(1080).url() : undefined}
              >
                <source src={hero.videoUrl} />
              </video>
            </>
          ) : hero.image ? (
            <Image
              src={urlFor(hero.image).width(1920).height(1080).url()}
              alt={hero.headline}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          ) : null}
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: (hero.overlayOpacity ?? 40) / 100 }}
          />
          <div className="relative z-10 text-center text-white px-4 max-w-4xl">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold mb-4">
              {hero.headline}
            </h1>
            {hero.subheadline && (
              <p className="text-lg sm:text-xl mb-8 text-white/90">{hero.subheadline}</p>
            )}
            <Link
              href={hero.ctaUrl}
              className="inline-flex items-center px-8 py-3 text-lg font-medium bg-gold hover:bg-gold/90 text-white rounded transition-colors"
            >
              {hero.ctaLabel}
            </Link>
          </div>
        </section>
      )}

      {/* About Preview */}
      {about && (
        <section className="py-20 px-4">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-serif text-3xl sm:text-4xl text-charcoal mb-6">
              {settings.home?.aboutHeading ?? about.pageTitle}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mb-8">{about.intro}</p>
            <Link href="/about" className="text-gold hover:text-gold/80 font-medium transition-colors">
              {settings.nav?.aboutLabel ?? 'About'} &rarr;
            </Link>
          </div>
        </section>
      )}

      {/* Services */}
      {services.length > 0 && (
        <section className="py-20 px-4 bg-gray-50">
          <div className="mx-auto max-w-7xl">
            {settings.home?.servicesHeading && (
              <h2 className="font-serif text-3xl sm:text-4xl text-charcoal mb-2">
                {settings.home.servicesHeading}
              </h2>
            )}
            {settings.home?.servicesSubheading && (
              <p className="text-lg text-gray-600 mb-12">{settings.home.servicesSubheading}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.slice(0, 6).map((service) => (
                <Link
                  key={service._id}
                  href={`/services/${service.slug.current}`}
                  className="group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  {service.coverImage && (
                    <div className="relative h-48 mb-4 rounded overflow-hidden">
                      <Image
                        src={urlFor(service.coverImage).width(600).height(400).url()}
                        alt={service.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <h3 className="font-serif text-xl text-charcoal mb-2">{service.title}</h3>
                  <p className="text-gray-600 text-sm">{service.shortDescription}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Portfolio */}
      {projects.length > 0 && (
        <section className="py-20 px-4">
          <div className="mx-auto max-w-7xl">
            {settings.home?.portfolioHeading && (
              <h2 className="font-serif text-3xl sm:text-4xl text-charcoal mb-2">
                {settings.home.portfolioHeading}
              </h2>
            )}
            {settings.home?.portfolioSubheading && (
              <p className="text-lg text-gray-600 mb-12">{settings.home.portfolioSubheading}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.slice(0, 6).map((project) => (
                <Link
                  key={project._id}
                  href={`/portfolio/${project.slug.current}`}
                  className="group"
                >
                  <div className="relative h-64 rounded-lg overflow-hidden mb-4">
                    <Image
                      src={urlFor(project.coverImage).width(600).height(400).url()}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <h3 className="font-serif text-xl text-charcoal mb-1">{project.title}</h3>
                  {project.clientName && (
                    <p className="text-sm text-gray-500">{project.clientName}</p>
                  )}
                  <p className="text-gray-600 text-sm mt-2">{project.shortDescription}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-20 px-4 bg-gray-50">
          <div className="mx-auto max-w-7xl">
            {settings.home?.testimonialsHeading && (
              <h2 className="font-serif text-3xl sm:text-4xl text-charcoal mb-12">
                {settings.home.testimonialsHeading}
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((t) => (
                <blockquote key={t._id} className="bg-white p-6 rounded-lg shadow-sm">
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
          </div>
        </section>
      )}

      {/* Insights */}
      {articles.length > 0 && (
        <section className="py-20 px-4">
          <div className="mx-auto max-w-7xl">
            {settings.home?.insightsHeading && (
              <h2 className="font-serif text-3xl sm:text-4xl text-charcoal mb-12">
                {settings.home.insightsHeading}
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.slice(0, 3).map((article) => (
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
                  <h3 className="font-serif text-xl text-charcoal mb-2">{article.title}</h3>
                  <p className="text-gray-600 text-sm">{article.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {(settings.home?.ctaHeading || settings.home?.ctaSubheading) && (
        <section className="py-20 px-4 bg-charcoal text-white text-center">
          <div className="mx-auto max-w-3xl">
            {settings.home?.ctaHeading && (
              <h2 className="font-serif text-3xl sm:text-4xl mb-4">{settings.home.ctaHeading}</h2>
            )}
            {settings.home?.ctaSubheading && (
              <p className="text-lg text-gray-300 mb-8">{settings.home.ctaSubheading}</p>
            )}
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-3 text-lg font-medium bg-gold hover:bg-gold/90 text-white rounded transition-colors"
            >
              {settings.home?.ctaButtonLabel ?? 'Contact Us'}
            </Link>
          </div>
        </section>
      )}
    </>
  )
}
