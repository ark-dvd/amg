import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getSiteSettings, getProjectBySlug, getAllProjectSlugs, getTestimonialsForProject } from '@/lib/sanity/queries'
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
  const slugs = await getAllProjectSlugs()
  return slugs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [settings, project] = await Promise.all([
    getSiteSettings(),
    getProjectBySlug(slug),
  ])
  if (!settings || !project) return { title: 'Project Not Found' }
  return buildMetadata({
    path: `/portfolio/${slug}`,
    title: project.seoTitle ?? `${project.title} — ${settings.siteName}`,
    description: project.seoDescription ?? project.shortDescription ?? settings.globalSeoDescription,
    ogImage: project.coverImage,
    siteName: settings.siteName,
    globalSeoDescription: settings.globalSeoDescription,
    globalOgImage: settings.ogImage,
  })
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params
  const [settings, project] = await Promise.all([
    getSiteSettings(),
    getProjectBySlug(slug),
  ])

  if (!project) return notFound()
  if (!settings) return null

  const testimonials = await getTestimonialsForProject(project._id)

  const jsonLd = buildJsonLdScript([
    buildOrganizationJsonLd(settings),
    {
      '@type': 'CreativeWork',
      name: project.title,
      description: project.shortDescription,
      url: canonicalUrl(`/portfolio/${slug}`),
      ...(project.completedAt ? { dateCreated: project.completedAt } : {}),
      creator: {
        '@type': 'Organization',
        name: settings.siteName,
      },
    },
    buildBreadcrumbJsonLd([
      { name: settings.siteName, path: '/' },
      { name: settings.nav?.portfolioLabel ?? 'Portfolio', path: '/portfolio' },
      { name: project.title, path: `/portfolio/${slug}` },
    ]),
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <article className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-4">{project.title}</h1>
        {project.clientName && (
          <p className="text-lg text-gray-500 mb-2">{project.clientName}</p>
        )}
        <p className="text-xl text-gray-600 mb-8">{project.shortDescription}</p>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 mb-8 text-sm text-gray-500">
          {project.projectType && <span>{project.projectType}</span>}
          {project.completedAt && (
            <span>{new Date(project.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
          )}
        </div>

        {/* Technologies */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {project.technologies.map((tech) => (
              <span key={tech} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Cover Image */}
        {project.coverImage && (
          <div className="relative h-64 sm:h-96 rounded-lg overflow-hidden mb-12">
            <Image
              src={urlFor(project.coverImage).width(1200).height(600).url()}
              alt={project.title}
              fill
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
          </div>
        )}

        {/* Body */}
        {project.body && <PortableTextRenderer value={project.body} />}

        {/* Screenshots */}
        {project.screenshots && project.screenshots.length > 0 && (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {project.screenshots.map((screenshot, i) => (
              <div key={i} className="relative h-48 sm:h-64 rounded-lg overflow-hidden">
                <Image
                  src={urlFor(screenshot).width(800).height(500).url()}
                  alt={`${project.title} screenshot ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
        )}

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <section className="mt-16">
            <div className="space-y-6">
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
      </article>
    </>
  )
}
