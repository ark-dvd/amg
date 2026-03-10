import Link from 'next/link'
import { getSiteSettings } from '@/lib/sanity/queries'

export default async function NotFound() {
  const settings = await getSiteSettings()

  const heading = settings?.error404?.heading ?? 'Page Not Found'
  const message = settings?.error404?.message ?? "The page you're looking for doesn't exist."
  const ctaLabel = settings?.error404?.ctaLabel ?? 'Go Home'

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="font-serif text-5xl text-charcoal mb-4">{heading}</h1>
      <p className="text-lg text-gray-600 mb-8">{message}</p>
      <Link
        href="/"
        className="inline-flex items-center px-6 py-3 bg-gold hover:bg-gold/90 text-white font-medium rounded transition-colors"
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
