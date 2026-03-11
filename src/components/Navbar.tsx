'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
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
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'
  const links = navLinks(nav)
  const ctaLabel = nav?.ctaLabel ?? 'Get in Touch'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const transparent = isHome && !scrolled && !mobileOpen

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        transparent
          ? 'bg-transparent'
          : 'bg-white/95 backdrop-blur-sm shadow-sm'
      }`}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          {logo ? (
            <Image
              src={urlFor(logo).width(160).height(40).url()}
              alt={siteName}
              width={160}
              height={40}
              className={`h-8 w-auto transition-all duration-300 ${transparent ? 'brightness-0 invert' : ''}`}
            />
          ) : (
            <span className={`font-serif text-xl font-semibold transition-colors duration-300 ${transparent ? 'text-white' : 'text-charcoal'}`}>
              {siteName}
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors duration-300 ${
                transparent
                  ? 'text-white/80 hover:text-white'
                  : 'text-gray-600 hover:text-charcoal'
              }`}
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
          className={`md:hidden p-2 -mr-2 transition-colors duration-300 ${transparent ? 'text-white' : 'text-charcoal'}`}
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
