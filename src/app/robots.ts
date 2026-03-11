import type { MetadataRoute } from 'next'

const DOMAIN = process.env.NEXT_PUBLIC_CANONICAL_DOMAIN ?? 'https://amgpm.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/admin', '/api/'],
      },
    ],
    sitemap: `${DOMAIN}/sitemap.xml`,
  }
}
