import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import { getSiteSettings } from '@/lib/sanity/queries'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['400', '600'],
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
    <html lang="en" className={`${inter.variable} ${cormorantGaramond.variable}`}>
      <body className="font-sans antialiased text-charcoal">
        {settings?.gaId && <GoogleAnalytics gaId={settings.gaId} nonce={nonce} />}
        <Navbar
          siteName={settings?.siteName ?? 'AMG'}
          logo={settings?.logo}
          nav={settings?.nav}
        />
        <main className="min-h-screen">{children}</main>
        {settings && <Footer settings={settings} />}
      </body>
    </html>
  )
}
