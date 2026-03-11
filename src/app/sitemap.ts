import type { MetadataRoute } from 'next'
import { readClient } from '@/lib/sanity/client'
import { getAllServiceSlugs, getAllProjectSlugs, getAllArticleSlugs } from '@/lib/sanity/queries'

const DOMAIN = process.env.NEXT_PUBLIC_CANONICAL_DOMAIN ?? 'https://amgpm.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [serviceSlugs, projectSlugs, articleSlugs, siteSettings] = await Promise.all([
    getAllServiceSlugs(),
    getAllProjectSlugs(),
    getAllArticleSlugs(),
    readClient.fetch<{ updatedAt: string } | null>(
      '*[_id == "singleton.siteSettings"][0]{ updatedAt }'
    ),
  ])

  const siteLastMod = siteSettings?.updatedAt
    ? new Date(siteSettings.updatedAt).toISOString()
    : new Date().toISOString()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: DOMAIN, lastModified: siteLastMod, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${DOMAIN}/about`, lastModified: siteLastMod, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${DOMAIN}/services`, lastModified: siteLastMod, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${DOMAIN}/portfolio`, lastModified: siteLastMod, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${DOMAIN}/insights`, lastModified: siteLastMod, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${DOMAIN}/contact`, lastModified: siteLastMod, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${DOMAIN}/terms`, lastModified: siteLastMod, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${DOMAIN}/privacy`, lastModified: siteLastMod, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${DOMAIN}/accessibility`, lastModified: siteLastMod, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const serviceRoutes: MetadataRoute.Sitemap = serviceSlugs.map(({ slug, _updatedAt }) => ({
    url: `${DOMAIN}/services/${slug}`,
    lastModified: new Date(_updatedAt).toISOString(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const projectRoutes: MetadataRoute.Sitemap = projectSlugs.map(({ slug, _updatedAt }) => ({
    url: `${DOMAIN}/portfolio/${slug}`,
    lastModified: new Date(_updatedAt).toISOString(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const articleRoutes: MetadataRoute.Sitemap = articleSlugs.map(({ slug, _updatedAt }) => ({
    url: `${DOMAIN}/insights/${slug}`,
    lastModified: new Date(_updatedAt).toISOString(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...serviceRoutes, ...projectRoutes, ...articleRoutes]
}
