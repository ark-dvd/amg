import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { DM_Sans, Instrument_Serif } from 'next/font/google'
import { getSiteSettings } from '@/lib/sanity/queries'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  weight: '400',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: settings?.globalSeoTitle ?? settings?.siteName ?? 'AMG',
    description: settings?.globalSeoDescription ?? '',
    metadataBase: new URL(process.env.NEXT_PUBLIC_CANONICAL_DOMAIN ?? 'https://amgpm.com'),
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [settings, headersList] = await Promise.all([
    getSiteSettings(),
    headers(),
  ])
  const nonce = headersList.get('x-nonce') ?? undefined

  return (
    <html lang="en" className={`${dmSans.variable} ${instrumentSerif.variable}`}>
      <body className="font-sans antialiased text-charcoal bg-surface">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-charcoal focus:text-white focus:px-4 focus:py-2 focus:rounded"
        >
          Skip to main content
        </a>
        {settings?.gaId && <GoogleAnalytics gaId={settings.gaId} nonce={nonce} />}
        <Navbar
          siteName={settings?.siteName ?? 'AMG'}
          logo={settings?.logo}
          nav={settings?.nav}
        />
        <main id="main-content" className="min-h-screen">{children}</main>
        {settings && <Footer settings={settings} />}
      </body>
    </html>
  )
}
