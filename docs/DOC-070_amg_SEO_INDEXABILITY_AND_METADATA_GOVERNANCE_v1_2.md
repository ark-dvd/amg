# DOC-070 — AMG SEO, Indexability & Metadata Governance

**Status:** Canonical
**Effective Date:** March 10, 2026
**Version:** 1.2
**Timestamp:** 20260310-1302 (CST)
**Governing Document:** DOC-000 — AMG System Charter & Product Promise (v1.1)

---

### Revision History

| Version | Timestamp (CST) | Changes |
|---------|-----------------|---------|
| 1.0 | 20260309-1555 | Initial release |
| 1.1 | 20260310-1020 | §8 Structured Data fully specified per page type |
| 1.2 | 20260310-1302 | §13 Redirect Governance added — 301 policy for URL changes, 404 policy for deleted content, slug-change redirect mapping, one-hop chain limit, redirect loop prohibition |

---

### Document Standards

Canonical documents are written in English. All timestamps use Central Standard Time (CST).

---

## 1. Executive Intent

Search engine indexability is a governing system concern, not a marketing afterthought. Every public page must behave correctly as seen by Googlebot, as if we were submitting the site for a manual SEO audit with full scoring.

The governing standard is: pass/fail per requirement. No partial credit.

---

## 2. Indexability Policy

### 2.1 Public Routes — Must Be Indexable

| Route | Indexable |
|-------|-----------|
| `/` | Yes |
| `/about` | Yes |
| `/services` | Yes |
| `/services/[slug]` | Yes (active only) |
| `/portfolio` | Yes |
| `/portfolio/[slug]` | Yes (active, non-archived only) |
| `/insights` | Yes |
| `/insights/[slug]` | Yes (published only) |
| `/contact` | Yes |
| `/terms` | Yes |
| `/privacy` | Yes |
| `/accessibility` | Yes |

### 2.2 Protected Routes — Must Not Be Indexed

| Route Pattern | Reason |
|--------------|--------|
| `/admin` | Admin interface |
| `/admin/*` | Admin sub-routes |
| `/api/*` | API routes |

### 2.3 Draft/Inactive Content — Must Not Be Indexed

Draft articles, inactive services, and inactive/archived projects return HTTP `404`. Soft 404 (`200` with "not found" content) is non-compliant.

---

## 3. robots.txt

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /admin
Disallow: /api/

Sitemap: https://[CANONICAL_DOMAIN]/sitemap.xml
```

Served without authentication. `CANONICAL_DOMAIN` from environment variable.

---

## 4. sitemap.xml

Dynamic generation by Next.js. Never a static file.

### 4.1 Included Routes

| Route | `changefreq` | `priority` |
|-------|-------------|------------|
| `/` | weekly | 1.0 |
| `/about` | monthly | 0.8 |
| `/services` | monthly | 0.8 |
| `/services/[slug]` (active) | monthly | 0.7 |
| `/portfolio` | monthly | 0.8 |
| `/portfolio/[slug]` (active, non-archived) | monthly | 0.7 |
| `/insights` | weekly | 0.8 |
| `/insights/[slug]` (published) | weekly | 0.7 |
| `/contact` | yearly | 0.6 |
| `/terms` | yearly | 0.3 |
| `/privacy` | yearly | 0.3 |
| `/accessibility` | yearly | 0.3 |

Admin and API routes are excluded. `<lastmod>` set to entity `updatedAt` or SiteSettings `updatedAt` for static pages.

---

## 5. Canonical URLs

- Every public page: `<link rel="canonical" href="...">` in `<head>`
- Uses `CANONICAL_DOMAIN` (HTTPS, no trailing slash)
- No query parameters in canonical URL
- `trailingSlash: false` in `next.config.js`
- `/about/` → `301` redirect to `/about`

---

## 6. Title and Meta Description

### 6.1 Title Tag Construction

| Page | Format |
|------|--------|
| Homepage | `[siteName]` or `[siteName] — [tagline]` |
| About | `About — [siteName]` |
| Services listing | `Services — [siteName]` |
| Service detail | `[service.title] — [siteName]` |
| Portfolio listing | `Portfolio — [siteName]` |
| Project detail | `[project.title] — [siteName]` |
| Insights listing | `Insights — [siteName]` |
| Article detail | `[article.title] — [siteName]` |
| Contact | `Contact — [siteName]` |
| Terms | `Terms of Use — [siteName]` |
| Privacy | `Privacy Policy — [siteName]` |
| Accessibility | `Accessibility — [siteName]` |
| 404 | `Page Not Found — [siteName]` |

Override: `seoTitle` field replaces the entire title when populated. Max 70 chars.

### 6.2 Meta Description

Source priority: entity `seoDescription` → `shortDescription` / `excerpt` → `globalSeoDescription` from SiteSettings → omit tag. Max 160 chars.

No two pages may share identical `<title>` or `<meta name="description">` values.

---

## 7. Open Graph and Twitter Cards

### 7.1 Required OG Tags (All Pages)

```html
<meta property="og:type" content="website" />
<meta property="og:url" content="[canonical URL]" />
<meta property="og:title" content="[page title]" />
<meta property="og:description" content="[meta description]" />
<meta property="og:image" content="[OG image URL — absolute HTTPS]" />
<meta property="og:site_name" content="[siteName]" />
```

OG image source priority: entity cover image → SiteSettings `ogImage` → omit tag. Recommended size: 1200×630px.

### 7.2 Twitter Cards

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[page title]" />
<meta name="twitter:description" content="[meta description]" />
<meta name="twitter:image" content="[OG image URL]" />
```

If `twitterUrl` is configured: `<meta name="twitter:site" content="[@handle]" />`.

### 7.3 Article-Specific OG Tags

```html
<meta property="og:type" content="article" />
<meta property="article:published_time" content="[publishedAt ISO-8601]" />
<meta property="article:modified_time" content="[updatedAt ISO-8601]" />
<meta property="article:author" content="[authorName or siteName]" />
```

---

## 8. Structured Data (JSON-LD)

Structured data is included in `<script type="application/ld+json">` tags in `<head>`. Multiple JSON-LD blocks per page are correct and expected. Fields with null or empty values are omitted — never rendered as `null` or `""`. All JSON-LD must be valid JSON. All URLs are absolute HTTPS.

### 8.1 Organization Block — All Pages

Included on every public page.

**Required:**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "[siteName]",
  "url": "[CANONICAL_DOMAIN]"
}
```

**Conditional (included when populated):**
- `logo`: `{ "@type": "ImageObject", "url": "[logo URL]" }`
- `contactPoint`: `{ "@type": "ContactPoint", "telephone": "...", "email": "...", "contactType": "customer service" }` — omitted if neither phone nor email configured
- `sameAs`: array of configured social URLs — omitted if empty

### 8.2 WebSite Block — Homepage Only

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "[siteName]",
  "url": "[CANONICAL_DOMAIN]"
}
```

### 8.3 Service Block — `/services/[slug]`

**Required:**
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "[service.title]",
  "description": "[service.shortDescription]",
  "url": "[canonical service URL]",
  "provider": {
    "@type": "Organization",
    "name": "[siteName]",
    "url": "[CANONICAL_DOMAIN]"
  }
}
```

**Conditional:** `"image": "[service.coverImage URL]"` if populated.

### 8.4 CreativeWork Block — `/portfolio/[slug]`

**Required:**
```json
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "[project.title]",
  "description": "[project.shortDescription]",
  "url": "[canonical project URL]",
  "creator": {
    "@type": "Organization",
    "name": "[siteName]",
    "url": "[CANONICAL_DOMAIN]"
  }
}
```

**Conditional (included when populated):**
- `"image": "[project.coverImage URL]"`
- `"dateCreated": "[project.completedAt — YYYY-MM-DD]"`
- `"about": "[project.projectType]"`
- `"keywords": "[technologies joined with ', ']"`
- `"client": { "@type": "Organization", "name": "[project.clientName]" }`

### 8.5 Article Block — `/insights/[slug]`

**Required:**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[article.title — max 110 chars]",
  "description": "[article.excerpt]",
  "url": "[canonical article URL]",
  "datePublished": "[article.publishedAt — ISO-8601]",
  "dateModified": "[article.updatedAt — ISO-8601]",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "[canonical article URL]"
  },
  "publisher": {
    "@type": "Organization",
    "name": "[siteName]",
    "url": "[CANONICAL_DOMAIN]"
  }
}
```

**Conditional:**
- `"image": "[article.coverImage URL]"` if populated
- `"author": { "@type": "Person", "name": "[authorName]" }` if populated; falls back to Organization object if empty
- `publisher.logo`: `{ "@type": "ImageObject", "url": "[logo URL]" }` if logo configured

`headline` truncated to 110 characters if longer (Google's Article headline limit).

### 8.6 ContactPage Block — `/contact`

**Required:**
```json
{
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": "[contact.pageHeading or 'Contact']",
  "url": "[CANONICAL_DOMAIN/contact]",
  "mainEntity": {
    "@type": "Organization",
    "name": "[siteName]",
    "url": "[CANONICAL_DOMAIN]"
  }
}
```

**Conditional on `mainEntity` (when populated in SiteSettings):**
- `"telephone": "[contactPhone]"`
- `"email": "[contactEmail]"`
- `"address": { "@type": "PostalAddress", "streetAddress": "[contactAddress]" }` if populated
- `"description": "[contact.pageSubheading]"` on root object if populated

### 8.7 BreadcrumbList — All Non-Homepage Pages

**Depth 2 (listing pages):**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "[CANONICAL_DOMAIN]" },
    { "@type": "ListItem", "position": 2, "name": "[page name]", "item": "[page URL]" }
  ]
}
```

**Depth 3 (entity detail pages):**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "[CANONICAL_DOMAIN]" },
    { "@type": "ListItem", "position": 2, "name": "[section name]", "item": "[section URL]" },
    { "@type": "ListItem", "position": 3, "name": "[entity.title]", "item": "[entity URL]" }
  ]
}
```

`name` at position 2 uses nav label from SiteSettings where configured, falling back to English default.

### 8.8 JSON-LD Rendering Rules

1. All JSON-LD in `<head>`, not in `<body>`
2. Multiple `<script type="application/ld+json">` blocks per page are valid and preferred over merging unrelated schemas
3. Organization block is always the first JSON-LD block on every page
4. JSON-LD is server-rendered — not client-side injected
5. Empty strings and null values are never included — field is omitted
6. All URLs are absolute HTTPS
7. JSON-LD validated using Google's Rich Results Test before production deployment

---

## 9. Image SEO

### 9.1 Alt Text

All images on public pages must have non-empty `alt` attributes. Source priority: Sanity image `alt` field → entity title fallback. `alt=""` acceptable only for purely decorative images.

### 9.2 Next.js Image Component

All public-facing images rendered via `next/image`. HTML `<img>` elements prohibited on public pages.

### 9.3 Image Dimensions

All `next/image` usages must include explicit `width` and `height` or use `fill` with a sized container.

---

## 10. noindex Rules

### 10.1 Required noindex

`/admin/*` and `/api/*` routes must include:
- `<meta name="robots" content="noindex, nofollow">`
- HTTP header `X-Robots-Tag: noindex`

### 10.2 Draft/Inactive Content

Draft articles, inactive services, inactive/archived projects return `404`. The `404` HTTP status code is the correct signal to Google.

---

## 11. Lighthouse Performance Requirements

Lighthouse scores ≥ 95 in all four categories are binding (DOC-000 §9.3). Performance implementation requirements are governed by DOC-080. SEO-layer requirements:

- All pages have `<title>` and `<meta name="description">`
- Canonical tags on all pages
- `robots.txt` and `sitemap.xml` accessible
- No noindex on public pages
- Images have alt text
- Mobile-friendly (DOC-050 §10)
- `lang="en"` on `<html>` element
- Heading hierarchy correct (`h1` once per page)

---

## 12. Compliance Checklist

| # | Requirement |
|---|-------------|
| 1 | `robots.txt` generated correctly |
| 2 | `sitemap.xml` dynamically generated, correct entries |
| 3 | Every public page: unique `<title>` and `<meta name="description">` |
| 4 | Every public page: canonical URL tag |
| 5 | Trailing slash redirect configured |
| 6 | All OG tags on all public pages |
| 7 | Twitter card tags on all public pages |
| 8 | JSON-LD Organization on all pages |
| 9 | JSON-LD WebSite on homepage |
| 10 | JSON-LD Service on `/services/[slug]` |
| 11 | JSON-LD CreativeWork on `/portfolio/[slug]` |
| 12 | JSON-LD Article on `/insights/[slug]` |
| 13 | JSON-LD ContactPage on `/contact` |
| 14 | BreadcrumbList on all non-homepage pages |
| 15 | All images have alt text |
| 16 | All images use `next/image` with dimensions |
| 17 | Admin routes return noindex |
| 18 | Draft/inactive content returns `404` |
| 19 | Lighthouse SEO score ≥ 95 in production |
| 20 | No accidental noindex on public pages |
| 21 | `CANONICAL_DOMAIN` set to production domain |
| 22 | Google Analytics script non-blocking (DOC-080 §4) |
| 23 | JSON-LD validated via Google Rich Results Test |
| 24 | All redirect mappings in `next.config.js` before go-live | 
| 25 | No redirect chain longer than one hop exists |

---

## 13. Redirect Governance

### 13.1 URL Change Policy

When a public route URL changes — whether through a slug change on a content entity, a page restructure, or any other modification — the old URL must issue a **permanent HTTP 301 redirect** to the new URL.

There are no exceptions. A changed URL that returns `404` instead of `301` permanently destroys any accumulated PageRank, backlinks, and search indexing for that URL. This constitutes an SEO defect.

### 13.2 Deleted Content Policy

When a content entity is permanently deleted (not archived — archived content is not public):
- The entity's public URL returns **HTTP 404**
- The URL is removed from `sitemap.xml` on the next sitemap generation
- No redirect is issued to a replacement URL unless explicitly configured
- A 404 is the correct and honest signal to Google for genuinely deleted content

Returning `200` with "not found" content ("soft 404") is non-compliant.

### 13.3 Slug Change Redirect Mapping

Slugs are immutable after first save (DOC-020 §4, DOC-050 §13.3). However, if an operator unlocks and changes a slug, the following must occur:

1. The operator is warned in the Back Office before the slug change is saved (per DOC-050 §13.3)
2. On save, the API creates a redirect mapping entry: `{ from: "/[section]/[old-slug]", to: "/[section]/[new-slug]", statusCode: 301 }`
3. The redirect mapping is stored in a dedicated Sanity document type (`redirectMapping`) or in `next.config.js` redirects array
4. The new URL becomes canonical; the old URL serves the 301 permanently

Redirect mappings must be deployed before the slug change goes live. A slug that changes without a corresponding redirect mapping is a broken-link defect.

### 13.4 One-Hop Chain Limit

Redirect chains longer than one hop are prohibited. If URL A previously redirected to URL B, and URL B now redirects to URL C, the A→B redirect must be updated to A→C directly.

Redirect chains degrade user experience (additional latency per hop) and dilute PageRank passing. Any redirect chain longer than one hop discovered in production is a defect requiring immediate remediation.

### 13.5 Redirect Loop Prohibition

A redirect loop — where a URL eventually redirects back to itself through a chain of redirects — is a critical defect. It produces an infinite loop in browsers and HTTP clients, renders the URL inaccessible, and causes Googlebot to permanently stop crawling it.

Redirects must be tested before deployment to verify no loops exist. The trailing-slash redirect (`/about/` → `/about`) must not conflict with any other redirect rules.

### 13.6 Redirect Implementation

All 301 redirects are configured in `next.config.js` `redirects` array or via `generateStaticParams`-aware redirect logic in route handlers. They are not implemented via client-side JavaScript.

### 13.7 Redirect Testing

Before any deployment that includes URL changes or slug modifications:
- All new redirects are tested to confirm the correct HTTP status code (301)
- All existing redirect chains are verified to confirm one-hop compliance
- The sitemap is verified to contain the new URL and not the old URL

---

*End of document.*
