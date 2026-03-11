export interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

export type PortableTextContent = Array<{ _type: string; _key: string; [key: string]: unknown }>

// ─── Base document fields ───────────────────────────────────────

interface SanityDocumentBase {
  _id: string
  _type: string
  _rev: string
  _createdAt: string
  _updatedAt: string
}

// ─── Hero (Singleton) ───────────────────────────────────────────

export interface SanityFileAsset {
  _type: 'file'
  asset: {
    _ref: string
    _type: 'reference'
  }
}

export interface HeroDocument extends SanityDocumentBase {
  _type: 'hero'
  mediaType: 'image' | 'video'
  image?: SanityImage
  videoAsset?: SanityFileAsset
  videoPoster?: SanityImage
  headline: string
  subheadline?: string
  ctaLabel: string
  ctaUrl: string
  overlayOpacity?: number
  updatedAt: string
}

// ─── About (Singleton) ─────────────────────────────────────────

export interface TeamMember {
  _key: string
  _type: 'teamMember'
  name: string
  role: string
  bio?: string
  photo?: SanityImage
  linkedinUrl?: string
  order: number
}

export interface AboutDocument extends SanityDocumentBase {
  _type: 'about'
  pageTitle: string
  intro: string
  body: PortableTextContent
  teamSectionTitle?: string
  teamMembers?: TeamMember[]
  coverImage?: SanityImage
  updatedAt: string
}

// ─── Service (Collection) ───────────────────────────────────────

export interface ServiceDocument extends SanityDocumentBase {
  _type: 'service'
  title: string
  slug: { _type: 'slug'; current: string }
  shortDescription: string
  body: PortableTextContent
  icon?: string
  coverImage?: SanityImage
  isActive: boolean
  order: number
  seoTitle?: string
  seoDescription?: string
  createdAt: string
  updatedAt: string
}

// ─── Project (Collection) ───────────────────────────────────────

export interface ProjectDocument extends SanityDocumentBase {
  _type: 'project'
  title: string
  slug: { _type: 'slug'; current: string }
  clientName?: string
  shortDescription: string
  body: PortableTextContent
  projectType?: string
  technologies?: string[]
  coverImage: SanityImage
  screenshots?: SanityImage[]
  completedAt?: string
  isActive: boolean
  featuredOnHomepage?: boolean
  order: number
  isArchived: boolean
  archivedAt?: string
  seoTitle?: string
  seoDescription?: string
  createdAt: string
  updatedAt: string
}

// ─── Testimonial (Collection) ───────────────────────────────────

export interface TestimonialDocument extends SanityDocumentBase {
  _type: 'testimonial'
  authorName: string
  authorRole?: string
  authorCompany?: string
  authorPhoto?: SanityImage
  quote: string
  projectRef: {
    _type: 'reference'
    _ref: string
  }
  featuredOnPortfolio: boolean
  order: number
  isArchived: boolean
  archivedAt?: string
  createdAt: string
  updatedAt: string
}

// ─── Article (Collection) ───────────────────────────────────────

export interface ArticleDocument extends SanityDocumentBase {
  _type: 'article'
  title: string
  slug: { _type: 'slug'; current: string }
  excerpt: string
  body: PortableTextContent
  coverImage?: SanityImage
  category?: string
  tags?: string[]
  authorName?: string
  isDraft: boolean
  isPublished: boolean
  publishedAt?: string
  seoTitle?: string
  seoDescription?: string
  createdAt: string
  updatedAt: string
}

// ─── SiteSettings (Singleton) ───────────────────────────────────

export interface SiteSettingsDocument extends SanityDocumentBase {
  _type: 'siteSettings'
  // Section A: Identity
  siteName: string
  tagline?: string
  logo?: SanityImage
  favicon?: SanityImage
  // Section B: Contact
  contactEmail?: string
  contactPhone?: string
  contactAddress?: string
  // Section C: SEO
  globalSeoTitle?: string
  globalSeoDescription?: string
  ogImage?: SanityImage
  // Section D: Analytics
  gaId?: string
  // Section E: Social Links
  linkedinUrl?: string
  twitterUrl?: string
  facebookUrl?: string
  instagramUrl?: string
  youtubeUrl?: string
  // Section F: Footer
  footerText?: string
  termsLabel?: string
  privacyLabel?: string
  accessibilityLabel?: string
  // Section G: Policy Pages
  termsContent?: PortableTextContent
  privacyContent?: PortableTextContent
  accessibilityContent?: PortableTextContent
  // Section H: Navigation Labels
  nav?: {
    aboutLabel?: string
    servicesLabel?: string
    portfolioLabel?: string
    insightsLabel?: string
    contactLabel?: string
    ctaLabel?: string
  }
  // Section I: Homepage Labels
  home?: {
    aboutHeading?: string
    servicesHeading?: string
    servicesSubheading?: string
    portfolioHeading?: string
    portfolioSubheading?: string
    testimonialsHeading?: string
    insightsHeading?: string
    ctaHeading?: string
    ctaSubheading?: string
    ctaButtonLabel?: string
  }
  // Section J: Services Page
  services?: {
    pageHeading?: string
    pageSubheading?: string
  }
  // Section K: Portfolio Page
  portfolio?: {
    pageHeading?: string
    pageSubheading?: string
    testimonialsHeading?: string
  }
  // Section L: Insights Page
  insights?: {
    pageHeading?: string
    pageSubheading?: string
  }
  // Section M: Contact Page
  contact?: {
    pageHeading?: string
    pageSubheading?: string
    formNameLabel?: string
    formEmailLabel?: string
    formPhoneLabel?: string
    formCompanyLabel?: string
    formMessageLabel?: string
    formSubmitLabel?: string
    formSuccessMessage?: string
    formErrorMessage?: string
  }
  // Section N: Empty States
  empty?: {
    servicesMessage?: string
    portfolioMessage?: string
    insightsMessage?: string
  }
  // Section O: 404 & Error Page
  error404?: {
    heading?: string
    message?: string
    ctaLabel?: string
  }
  // Section P: System
  updatedAt: string
}
