import Image from 'next/image'
import { getSiteSettings, getAbout } from '@/lib/sanity/queries'
import { urlFor } from '@/lib/sanity/image'
import { buildMetadata, buildOrganizationJsonLd, buildBreadcrumbJsonLd, buildJsonLdScript } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const [settings, about] = await Promise.all([getSiteSettings(), getAbout()])
  if (!settings || !about) return { title: 'About' }
  return buildMetadata({
    path: '/about',
    title: `${about.pageTitle} — ${settings.siteName}`,
    description: about.intro,
    siteName: settings.siteName,
    globalSeoDescription: settings.globalSeoDescription,
    globalOgImage: settings.ogImage,
  })
}

export default async function AboutPage() {
  const [settings, about] = await Promise.all([getSiteSettings(), getAbout()])
  if (!settings || !about) return notFound()

  const jsonLd = buildJsonLdScript([
    buildOrganizationJsonLd(settings),
    buildBreadcrumbJsonLd([
      { name: settings.siteName, path: '/' },
      { name: about.pageTitle, path: '/about' },
    ]),
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-6">{about.pageTitle}</h1>
        <p className="text-xl text-gray-600 mb-12">{about.intro}</p>

        {about.coverImage && (
          <div className="relative h-64 sm:h-96 rounded-lg overflow-hidden mb-12">
            <Image
              src={urlFor(about.coverImage).width(1200).height(600).url()}
              alt={about.pageTitle}
              fill
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
            />
          </div>
        )}

        {about.body && <PortableTextRenderer value={about.body} />}

        {/* Team Section */}
        {about.teamMembers && about.teamMembers.length > 0 && (
          <section className="mt-16">
            {about.teamSectionTitle && (
              <h2 className="font-serif text-3xl text-charcoal mb-8">{about.teamSectionTitle}</h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {about.teamMembers
                .sort((a, b) => a.order - b.order)
                .map((member) => (
                  <div key={member._key} className="text-center">
                    {member.photo && (
                      <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                        <Image
                          src={urlFor(member.photo).width(256).height(256).url()}
                          alt={member.name}
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                      </div>
                    )}
                    <h3 className="font-medium text-charcoal">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.role}</p>
                    {member.bio && <p className="text-sm text-gray-600 mt-2">{member.bio}</p>}
                    {member.linkedinUrl && (
                      <a
                        href={member.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gold hover:text-gold/80 mt-2 inline-block"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
