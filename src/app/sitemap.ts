import type { MetadataRoute } from 'next'
import { getAllServiceSlugs, getAllProjectSlugs, getAllArticleSlugs } from '@/lib/sanity/queries'

const DOMAIN = process.env.NEXT_PUBLIC_CANONICAL_DOMAIN ?? 'https://amgpm.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [serviceSlugs, projectSlugs, articleSlugs] = await Promise.all([
    getAllServiceSlugs(),
    getAllProjectSlugs(),
    getAllArticleSlugs(),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: DOMAIN, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${DOMAIN}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${DOMAIN}/services`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${DOMAIN}/portfolio`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${DOMAIN}/insights`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${DOMAIN}/contact`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${DOMAIN}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${DOMAIN}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${DOMAIN}/accessibility`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const serviceRoutes: MetadataRoute.Sitemap = serviceSlugs.map((slug) => ({
    url: `${DOMAIN}/services/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const projectRoutes: MetadataRoute.Sitemap = projectSlugs.map((slug) => ({
    url: `${DOMAIN}/portfolio/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const articleRoutes: MetadataRoute.Sitemap = articleSlugs.map((slug) => ({
    url: `${DOMAIN}/insights/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...serviceRoutes, ...projectRoutes, ...articleRoutes]
}
