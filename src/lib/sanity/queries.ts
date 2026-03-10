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

// ─── Site Settings (used by every page) ─────────────────────────

export async function getSiteSettings(): Promise<SiteSettingsDocument | null> {
  return readClient.fetch<SiteSettingsDocument | null>(
    '*[_id == "singleton.siteSettings"][0]'
  )
}

// ─── Hero ────────────────────────────────────────────────────────

export async function getHero(): Promise<HeroDocument | null> {
  return readClient.fetch<HeroDocument | null>(
    '*[_id == "singleton.hero"][0]'
  )
}

// ─── About ───────────────────────────────────────────────────────

export async function getAbout(): Promise<AboutDocument | null> {
  return readClient.fetch<AboutDocument | null>(
    '*[_id == "singleton.about"][0]'
  )
}

// ─── Services ────────────────────────────────────────────────────

export async function getActiveServices(): Promise<ServiceDocument[]> {
  return readClient.fetch<ServiceDocument[]>(
    '*[_type == "service" && isActive == true] | order(order asc)'
  )
}

export async function getServiceBySlug(slug: string): Promise<ServiceDocument | null> {
  return readClient.fetch<ServiceDocument | null>(
    '*[_type == "service" && slug.current == $slug && isActive == true][0]',
    { slug }
  )
}

export async function getAllServiceSlugs(): Promise<string[]> {
  return readClient.fetch<string[]>(
    '*[_type == "service" && isActive == true].slug.current'
  )
}

// ─── Projects ────────────────────────────────────────────────────

export async function getActiveProjects(): Promise<ProjectDocument[]> {
  return readClient.fetch<ProjectDocument[]>(
    '*[_type == "project" && isActive == true && isArchived == false] | order(order asc)'
  )
}

export async function getFeaturedProjects(): Promise<ProjectDocument[]> {
  return readClient.fetch<ProjectDocument[]>(
    '*[_type == "project" && isActive == true && isArchived == false && featuredOnHomepage == true] | order(order asc)'
  )
}

export async function getProjectBySlug(slug: string): Promise<ProjectDocument | null> {
  return readClient.fetch<ProjectDocument | null>(
    '*[_type == "project" && slug.current == $slug && isActive == true && isArchived == false][0]',
    { slug }
  )
}

export async function getAllProjectSlugs(): Promise<string[]> {
  return readClient.fetch<string[]>(
    '*[_type == "project" && isActive == true && isArchived == false].slug.current'
  )
}

// ─── Testimonials ────────────────────────────────────────────────

export async function getFeaturedTestimonials(): Promise<TestimonialDocument[]> {
  return readClient.fetch<TestimonialDocument[]>(
    '*[_type == "testimonial" && featuredOnPortfolio == true && isArchived == false] | order(order asc)'
  )
}

export async function getTestimonialsForProject(projectId: string): Promise<TestimonialDocument[]> {
  return readClient.fetch<TestimonialDocument[]>(
    '*[_type == "testimonial" && projectRef._ref == $projectId && isArchived == false] | order(order asc)',
    { projectId }
  )
}

// ─── Articles ────────────────────────────────────────────────────

export async function getPublishedArticles(): Promise<ArticleDocument[]> {
  return readClient.fetch<ArticleDocument[]>(
    '*[_type == "article" && isPublished == true && isDraft == false] | order(publishedAt desc)'
  )
}

export async function getArticleBySlug(slug: string): Promise<ArticleDocument | null> {
  return readClient.fetch<ArticleDocument | null>(
    '*[_type == "article" && slug.current == $slug && isPublished == true && isDraft == false][0]',
    { slug }
  )
}

export async function getAllArticleSlugs(): Promise<string[]> {
  return readClient.fetch<string[]>(
    '*[_type == "article" && isPublished == true && isDraft == false].slug.current'
  )
}
