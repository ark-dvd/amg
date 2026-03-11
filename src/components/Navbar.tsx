'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { urlFor } from '@/lib/sanity/image'
import type { SanityImage } from '@/types/sanity'

interface NavbarProps {
  siteName: string
  logo?: SanityImage | null
  nav?: {
    aboutLabel?: string
    servicesLabel?: string
    portfolioLabel?: string
    insightsLabel?: string
    contactLabel?: string
    ctaLabel?: string
  }
}

const navLinks = (nav: NavbarProps['nav']) => [
  { href: '/about', label: nav?.aboutLabel ?? 'About' },
  { href: '/services', label: nav?.servicesLabel ?? 'Services' },
  { href: '/portfolio', label: nav?.portfolioLabel ?? 'Portfolio' },
  { href: '/insights', label: nav?.insightsLabel ?? 'Insights' },
  { href: '/contact', label: nav?.contactLabel ?? 'Contact' },
]

export function Navbar({ siteName, logo, nav }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const links = navLinks(nav)
  const ctaLabel = nav?.ctaLabel ?? 'Get in Touch'

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          {logo ? (
            <Image
              src={urlFor(logo).width(160).height(40).url()}
              alt={siteName}
              width={160}
              height={40}
              className="h-8 w-auto"
            />
          ) : (
            <span className="font-serif text-xl font-semibold text-charcoal">{siteName}</span>
          )}
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-600 hover:text-charcoal transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gold hover:bg-gold/90 rounded transition-colors"
          >
            {ctaLabel}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 -mr-2 text-charcoal"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="px-4 py-4 space-y-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-base text-gray-600 hover:text-charcoal py-2"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="block w-full text-center px-4 py-3 text-sm font-medium text-white bg-gold hover:bg-gold/90 rounded transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
