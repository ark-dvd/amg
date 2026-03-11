import dynamic from 'next/dynamic'
import { getSiteSettings } from '@/lib/sanity/queries'
import { buildMetadata, buildOrganizationJsonLd, buildBreadcrumbJsonLd, buildJsonLdScript, canonicalUrl } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import type { Metadata } from 'next'

const ContactForm = dynamic(() => import('./ContactForm').then(m => m.ContactForm), {
  loading: () => <div className="animate-pulse h-96 bg-border/50 rounded-lg" />,
})

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  if (!settings) return { title: 'Contact' }
  const title = settings.contact?.pageHeading
    ? `${settings.contact.pageHeading} — ${settings.siteName}`
    : `${settings.nav?.contactLabel ?? 'Contact'} — ${settings.siteName}`
  return buildMetadata({
    path: '/contact',
    title,
    description: settings.contact?.pageSubheading ?? settings.globalSeoDescription,
    siteName: settings.siteName,
    globalSeoDescription: settings.globalSeoDescription,
    globalOgImage: settings.ogImage,
  })
}

export default async function ContactPage() {
  const settings = await getSiteSettings()
  if (!settings) return null

  const jsonLd = buildJsonLdScript([
    buildOrganizationJsonLd(settings),
    {
      '@type': 'ContactPage',
      name: settings.contact?.pageHeading ?? settings.nav?.contactLabel ?? 'Contact',
      url: canonicalUrl('/contact'),
    },
    buildBreadcrumbJsonLd([
      { name: settings.siteName, path: '/' },
      { name: settings.nav?.contactLabel ?? 'Contact', path: '/contact' },
    ]),
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-3xl px-4 py-20 sm:py-28">
        <p className="text-xs font-medium uppercase tracking-widest text-gold mb-4">Contact</p>
        {settings.contact?.pageHeading && (
          <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-4">
            {settings.contact.pageHeading}
          </h1>
        )}
        {settings.contact?.pageSubheading && (
          <p className="text-xl text-muted mb-14">{settings.contact.pageSubheading}</p>
        )}

        <ContactForm
          labels={{
            name: settings.contact?.formNameLabel ?? 'Your Name',
            email: settings.contact?.formEmailLabel ?? 'Email Address',
            phone: settings.contact?.formPhoneLabel ?? 'Phone (optional)',
            company: settings.contact?.formCompanyLabel ?? 'Company (optional)',
            message: settings.contact?.formMessageLabel ?? 'Message',
            submit: settings.contact?.formSubmitLabel ?? 'Send Message',
            success: settings.contact?.formSuccessMessage ?? 'Thank you for your message. We will get back to you soon.',
            error: settings.contact?.formErrorMessage ?? 'Something went wrong. Please try again.',
          }}
        />
      </div>
    </>
  )
}
