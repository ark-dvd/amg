import { readClient } from './client'
import type {
  HeroDocument,
  AboutDocument,
  ServiceDocument,
  ProjectDocument,
  TestimonialDocument,
  ArticleDocument,
  SiteSettingsDocument,
} from '@/types/sanity'

function logIsrError(route: string, error: unknown): void {
  console.error(JSON.stringify({
    level: 'error',
    type: 'APP_ERROR',
    route,
    errorMessage: 'ISR data fetch failed — serving stale cache',
    timestamp: new Date().toISOString(),
    ...(error instanceof Error ? { internalDetail: error.message } : {}),
  }))
}

// ─── Site Settings (used by every page) ─────────────────────────

export async function getSiteSettings(): Promise<SiteSettingsDocument | null> {
  try {
    return await readClient.fetch<SiteSettingsDocument | null>(
      '*[_id == "singleton.siteSettings"][0]'
    )
  } catch (error) {
    logIsrError('/[site-settings]', error)
    return null
  }
}

// ─── Hero ────────────────────────────────────────────────────────

export async function getHero(): Promise<HeroDocument | null> {
  try {
    return await readClient.fetch<HeroDocument | null>(
      '*[_id == "singleton.hero"][0]'
    )
  } catch (error) {
    logIsrError('/', error)
    return null
  }
}

// ─── About ───────────────────────────────────────────────────────

export async function getAbout(): Promise<AboutDocument | null> {
  try {
    return await readClient.fetch<AboutDocument | null>(
      '*[_id == "singleton.about"][0]'
    )
  } catch (error) {
    logIsrError('/about', error)
    return null
  }
}

// ─── Services ────────────────────────────────────────────────────

export async function getActiveServices(): Promise<ServiceDocument[]> {
  try {
    return await readClient.fetch<ServiceDocument[]>(
      '*[_type == "service" && isActive == true] | order(order asc)'
    )
  } catch (error) {
    logIsrError('/services', error)
    return []
  }
}

export async function getServiceBySlug(slug: string): Promise<ServiceDocument | null> {
  try {
    return await readClient.fetch<ServiceDocument | null>(
      '*[_type == "service" && slug.current == $slug && isActive == true][0]',
      { slug }
    )
  } catch (error) {
    logIsrError(`/services/${slug}`, error)
    return null
  }
}

export async function getAllServiceSlugs(): Promise<string[]> {
  try {
    return await readClient.fetch<string[]>(
      '*[_type == "service" && isActive == true].slug.current'
    )
  } catch (error) {
    logIsrError('/services/[slugs]', error)
    return []
  }
}

// ─── Projects ────────────────────────────────────────────────────

export async function getActiveProjects(): Promise<ProjectDocument[]> {
  try {
    return await readClient.fetch<ProjectDocument[]>(
      '*[_type == "project" && isActive == true && isArchived == false && defined(coverImage)] | order(order asc)'
    )
  } catch (error) {
    logIsrError('/portfolio', error)
    return []
  }
}

export async function getFeaturedProjects(): Promise<ProjectDocument[]> {
  try {
    return await readClient.fetch<ProjectDocument[]>(
      '*[_type == "project" && isActive == true && isArchived == false && featuredOnHomepage == true && defined(coverImage)] | order(order asc)'
    )
  } catch (error) {
    logIsrError('/', error)
    return []
  }
}

export async function getProjectBySlug(slug: string): Promise<ProjectDocument | null> {
  try {
    return await readClient.fetch<ProjectDocument | null>(
      '*[_type == "project" && slug.current == $slug && isActive == true && isArchived == false][0]',
      { slug }
    )
  } catch (error) {
    logIsrError(`/portfolio/${slug}`, error)
    return null
  }
}

export async function getAllProjectSlugs(): Promise<string[]> {
  try {
    return await readClient.fetch<string[]>(
      '*[_type == "project" && isActive == true && isArchived == false].slug.current'
    )
  } catch (error) {
    logIsrError('/portfolio/[slugs]', error)
    return []
  }
}

// ─── Testimonials ────────────────────────────────────────────────

export async function getFeaturedTestimonials(): Promise<TestimonialDocument[]> {
  try {
    return await readClient.fetch<TestimonialDocument[]>(
      '*[_type == "testimonial" && featuredOnPortfolio == true && isArchived == false] | order(order asc)'
    )
  } catch (error) {
    logIsrError('/portfolio', error)
    return []
  }
}

export async function getTestimonialsForProject(projectId: string): Promise<TestimonialDocument[]> {
  try {
    return await readClient.fetch<TestimonialDocument[]>(
      '*[_type == "testimonial" && projectRef._ref == $projectId && isArchived == false] | order(order asc)',
      { projectId }
    )
  } catch (error) {
    logIsrError(`/portfolio/[testimonials]`, error)
    return []
  }
}

// ─── Articles ────────────────────────────────────────────────────

export async function getPublishedArticles(): Promise<ArticleDocument[]> {
  try {
    return await readClient.fetch<ArticleDocument[]>(
      '*[_type == "article" && isPublished == true && isDraft == false] | order(publishedAt desc)'
    )
  } catch (error) {
    logIsrError('/insights', error)
    return []
  }
}

export async function getArticleBySlug(slug: string): Promise<ArticleDocument | null> {
  try {
    return await readClient.fetch<ArticleDocument | null>(
      '*[_type == "article" && slug.current == $slug && isPublished == true && isDraft == false][0]',
      { slug }
    )
  } catch (error) {
    logIsrError(`/insights/${slug}`, error)
    return null
  }
}

export async function getAllArticleSlugs(): Promise<string[]> {
  try {
    return await readClient.fetch<string[]>(
      '*[_type == "article" && isPublished == true && isDraft == false].slug.current'
    )
  } catch (error) {
    logIsrError('/insights/[slugs]', error)
    return []
  }
}
