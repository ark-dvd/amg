import Link from 'next/link'
import type { SiteSettingsDocument } from '@/types/sanity'

interface FooterProps {
  settings: SiteSettingsDocument
}

export function Footer({ settings }: FooterProps) {
  const socialLinks = [
    { url: settings.linkedinUrl, label: 'LinkedIn' },
    { url: settings.twitterUrl, label: 'Twitter' },
    { url: settings.facebookUrl, label: 'Facebook' },
    { url: settings.instagramUrl, label: 'Instagram' },
    { url: settings.youtubeUrl, label: 'YouTube' },
  ].filter((s) => s.url)

  return (
    <footer className="bg-charcoal text-gray-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <p className="font-serif text-2xl text-white">{settings.siteName}</p>
            {settings.tagline && (
              <p className="mt-2 text-sm text-gray-400">{settings.tagline}</p>
            )}
          </div>

          {/* Contact */}
          <div className="space-y-2 text-sm">
            {settings.contactEmail && (
              <p>
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-accent-light transition-colors">
                  {settings.contactEmail}
                </a>
              </p>
            )}
            {settings.contactPhone && (
              <p>
                <a href={`tel:${settings.contactPhone}`} className="hover:text-accent-light transition-colors">
                  {settings.contactPhone}
                </a>
              </p>
            )}
            {settings.contactAddress && <p>{settings.contactAddress}</p>}
          </div>

          {/* Social */}
          {socialLinks.length > 0 && (
            <div className="flex gap-4">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-accent-light transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 pt-8 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          {settings.footerText && <p>{settings.footerText}</p>}
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-accent-light transition-colors">
              {settings.termsLabel ?? 'Terms of Use'}
            </Link>
            <Link href="/privacy" className="hover:text-accent-light transition-colors">
              {settings.privacyLabel ?? 'Privacy Policy'}
            </Link>
            <Link href="/accessibility" className="hover:text-accent-light transition-colors">
              {settings.accessibilityLabel ?? 'Accessibility'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
