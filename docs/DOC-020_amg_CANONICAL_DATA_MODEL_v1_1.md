# DOC-020 — AMG Canonical Data Model

**Status:** Canonical
**Effective Date:** March 9, 2026
**Version:** 1.1
**Timestamp:** 20260309-1555 (CST)
**Governing Documents:** DOC-000 — AMG System Charter & Product Promise (v1.1); DOC-010 — AMG Architecture & Responsibility Boundaries (v1.1)

---

### Revision History

| Version | Timestamp (CST) | Changes |
|---------|-----------------|---------|
| 1.0 | 20260309-1532 | Initial release |
| 1.1 | 20260309-1555 | §3.7 SiteSettings massively expanded with UIText section covering all zero-hardcode CMS text surfaces (navigation labels, section headings, form labels, CTAs, empty states, 404, footer, policy links); §3.4 Project updated with `isArchived`, `archivedAt` fields (archive/restore model replaces immediate cascade delete); §3.5 Testimonial updated with `isArchived`, `archivedAt`; §6 Optimistic Concurrency updated — `_rev` replaces `updatedAt` as primary concurrency token, `updatedAt` retained as display timestamp; §7 Invariant Registry updated for new fields; §8 Archive/Restore Lifecycle added |

---

### Document Standards

Canonical documents are written in English. All timestamps use Central Standard Time (CST).

---

## 1. Executive Intent

A data model defines what the system knows. Not what it displays. Not what the user types. Not what a form collects. What the system knows — the entities it tracks, the attributes it requires, the relationships it enforces, and the rules it applies to every mutation.

This document defines the canonical data model for AMG. Every entity, attribute, relationship, and invariant specified here is binding. Implementation that contradicts this model is non-compliant regardless of whether it appears to function.

---

## 2. Entity Overview

AMG contains only Content entities. There are no CRM entities.

### 2.1 Singleton Entities

| Entity | Sanity `_id` | Description |
|--------|-------------|-------------|
| Hero | `singleton.hero` | Full-screen homepage hero |
| About | `singleton.about` | Company about page |
| SiteSettings | `singleton.siteSettings` | Global config + all UI text |

### 2.2 Collection Entities

| Entity | Description |
|--------|-------------|
| Service | A service offering with its own detail page |
| Project | A completed project with portfolio detail page |
| Testimonial | A client endorsement, associated with one Project |
| Article | A thought leadership article with draft/publish lifecycle |

### 2.3 Entity Isolation

All entities are Content entities. No cross-family references exist. The only cross-entity reference is Testimonial → Project (many-to-one, required).

---

## 3. Entity Definitions

### 3.1 Hero (Singleton)

**Sanity `_id`:** `singleton.hero`  
**Sanity `_type`:** `hero`

| Field | Key | Type | Required | Notes |
|-------|-----|------|----------|-------|
| Media Type | `mediaType` | `"image" \| "video"` | Yes | Controls hero media type |
| Image | `image` | Sanity Image | Conditional | Required when `mediaType === "image"` |
| Video URL | `videoUrl` | string (URL) | Conditional | Required when `mediaType === "video"` |
| Video Poster | `videoPoster` | Sanity Image | No | Fallback before video loads |
| Headline | `headline` | string | Yes | Max 100 chars |
| Subheadline | `subheadline` | string | No | Max 250 chars |
| CTA Label | `ctaLabel` | string | Yes | Max 50 chars |
| CTA URL | `ctaUrl` | string | Yes | Internal path or external URL |
| Overlay Opacity | `overlayOpacity` | number | No | 0–100. Default: 40 |
| Updated At | `updatedAt` | datetime | Yes (system) | Set by API on every mutation |

**Invariants:** INV-001 through INV-005 (unchanged from v1.0)

---

### 3.2 About (Singleton)

**Sanity `_id`:** `singleton.about`  
**Sanity `_type`:** `about`

| Field | Key | Type | Required | Notes |
|-------|-----|------|----------|-------|
| Page Title | `pageTitle` | string | Yes | Max 100 chars |
| Intro | `intro` | string | Yes | Max 500 chars |
| Body | `body` | Portable Text | Yes | Full rich text |
| Team Section Title | `teamSectionTitle` | string | No | Max 80 chars |
| Team Members | `teamMembers` | TeamMember[] | No | Ordered array |
| Cover Image | `coverImage` | Sanity Image | No | About page hero |
| Updated At | `updatedAt` | datetime | Yes (system) | Set by API |

#### 3.2.1 TeamMember (Embedded Object)

| Field | Key | Type | Required |
|-------|-----|------|----------|
| Name | `name` | string (max 100) | Yes |
| Role | `role` | string (max 100) | Yes |
| Bio | `bio` | string (max 400) | No |
| Photo | `photo` | Sanity Image | No |
| LinkedIn URL | `linkedinUrl` | string (URL) | No |
| Display Order | `order` | number (int ≥ 0) | Yes |

---

### 3.3 Service (Collection)

**Sanity `_type`:** `service`

| Field | Key | Type | Required | Notes |
|-------|-----|------|----------|-------|
| Title | `title` | string | Yes | Max 100 chars |
| Slug | `slug` | string | Yes | Immutable after creation |
| Short Description | `shortDescription` | string | Yes | Max 200 chars |
| Body | `body` | Portable Text | Yes | Full detail page content |
| Icon | `icon` | string | No | Lucide icon name. Max 50 chars |
| Cover Image | `coverImage` | Sanity Image | No | |
| Is Active | `isActive` | boolean | Yes | Default: false |
| Display Order | `order` | number (int ≥ 0) | Yes | |
| SEO Title | `seoTitle` | string | No | Max 70 chars |
| SEO Description | `seoDescription` | string | No | Max 160 chars |
| Created At | `createdAt` | datetime | Yes (system) | Immutable |
| Updated At | `updatedAt` | datetime | Yes (system) | |

---

### 3.4 Project (Collection)

**Sanity `_type`:** `project`

| Field | Key | Type | Required | Notes |
|-------|-----|------|----------|-------|
| Title | `title` | string | Yes | Max 150 chars |
| Slug | `slug` | string | Yes | Immutable after creation |
| Client Name | `clientName` | string | No | Max 150 chars |
| Short Description | `shortDescription` | string | Yes | Max 250 chars |
| Body | `body` | Portable Text | Yes | |
| Project Type | `projectType` | string | No | Max 80 chars |
| Technologies | `technologies` | string[] | No | Max 20 tags, each max 50 chars |
| Cover Image | `coverImage` | Sanity Image | Yes | Required |
| Screenshots | `screenshots` | Sanity Image[] | No | Max 20 |
| Completed At | `completedAt` | date | No | YYYY-MM-DD |
| Is Active | `isActive` | boolean | Yes | Default: false |
| Featured On Homepage | `featuredOnHomepage` | boolean | No | Default: false |
| Display Order | `order` | number (int ≥ 0) | Yes | |
| **Is Archived** | **`isArchived`** | **boolean** | **Yes** | **Default: false. Archived projects are not visible on public site and not returned in admin active list.** |
| **Archived At** | **`archivedAt`** | **datetime** | **No** | **Set by API when `isArchived` transitions to true. Null when not archived.** |
| SEO Title | `seoTitle` | string | No | Max 70 chars |
| SEO Description | `seoDescription` | string | No | Max 160 chars |
| Created At | `createdAt` | datetime | Yes (system) | Immutable |
| Updated At | `updatedAt` | datetime | Yes (system) | |

**Archive/Delete Model:**

Project deletion follows a two-step lifecycle defined in §8. A Project is never immediately hard-deleted from the admin list view. The operator must first archive, then permanently delete from the archive view.

**Invariants:**
- INV-013: `slug` unique among all Projects
- INV-014: `slug` matches `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- INV-015: `coverImage` required
- INV-016: `isActive` defaults to false
- INV-017: `technologies` array: 1–20 strings if provided
- INV-031: `isArchived` defaults to false
- INV-032: `archivedAt` set by API when archiving; immutable once set. Cleared (set to null) by API when restoring

---

### 3.5 Testimonial (Collection)

**Sanity `_type`:** `testimonial`

| Field | Key | Type | Required | Notes |
|-------|-----|------|----------|-------|
| Author Name | `authorName` | string | Yes | Max 100 chars |
| Author Role | `authorRole` | string | No | Max 100 chars |
| Author Company | `authorCompany` | string | No | Max 100 chars |
| Author Photo | `authorPhoto` | Sanity Image | No | |
| Quote | `quote` | string | Yes | Max 600 chars |
| Project Reference | `projectRef` | Reference → Project | Yes | Required |
| Featured On Portfolio | `featuredOnPortfolio` | boolean | Yes | Default: false |
| Display Order | `order` | number (int ≥ 0) | Yes | |
| **Is Archived** | **`isArchived`** | **boolean** | **Yes** | **Default: false. Set to true when parent Project is archived.** |
| **Archived At** | **`archivedAt`** | **datetime** | **No** | **Set when archived.** |
| Created At | `createdAt` | datetime | Yes (system) | Immutable |
| Updated At | `updatedAt` | datetime | Yes (system) | |

**Invariants:**
- INV-018: `projectRef` required
- INV-019: `projectRef` must reference an existing Project
- INV-020: `featuredOnPortfolio` defaults to false
- INV-021: `order` non-negative integer
- INV-033: `isArchived` defaults to false
- INV-034: When a Project is archived, all its associated Testimonials are archived in the same atomic transaction
- INV-035: When a Project is restored, its archived Testimonials are restored in the same atomic transaction
- INV-036: When a Project is permanently deleted, all its associated Testimonials are permanently deleted in the same atomic transaction

---

### 3.6 Article (Collection)

**Sanity `_type`:** `article`

| Field | Key | Type | Required | Notes |
|-------|-----|------|----------|-------|
| Title | `title` | string | Yes | Max 200 chars |
| Slug | `slug` | string | Yes | Immutable after creation |
| Excerpt | `excerpt` | string | Yes | Max 300 chars |
| Body | `body` | Portable Text | Yes | |
| Cover Image | `coverImage` | Sanity Image | No | |
| Category | `category` | string | No | Max 80 chars |
| Tags | `tags` | string[] | No | Max 10 tags |
| Author Name | `authorName` | string | No | Max 100 chars |
| Is Draft | `isDraft` | boolean | Yes | Default: true |
| Is Published | `isPublished` | boolean | Yes | Default: false |
| Published At | `publishedAt` | datetime | No | Set once on first publish, immutable |
| SEO Title | `seoTitle` | string | No | Max 70 chars |
| SEO Description | `seoDescription` | string | No | Max 160 chars |
| Created At | `createdAt` | datetime | Yes (system) | Immutable |
| Updated At | `updatedAt` | datetime | Yes (system) | |

**Draft/Publish Lifecycle:**

| State | `isDraft` | `isPublished` | Public |
|-------|-----------|---------------|--------|
| Draft | true | false | No |
| Published | false | true | Yes |
| Unpublished | true | false | No |

- `publishedAt` is set exactly once — on first publish. Immutable after that.
- Only `isPublished: true` articles are returned by public queries (INV-027)

---

### 3.7 SiteSettings (Singleton) — Expanded

**Sanity `_id`:** `singleton.siteSettings`  
**Sanity `_type`:** `siteSettings`

SiteSettings is the authoritative source for all global site configuration AND all UI text governed by the Zero Hard-Coded Text principle (DOC-000 §3.1). It is organized into sections.

#### Section A: Identity

| Field | Key | Type | Required | Notes |
|-------|-----|------|----------|-------|
| Site Name | `siteName` | string | Yes | Max 100 chars |
| Site Tagline | `tagline` | string | No | Max 150 chars |
| Logo | `logo` | Sanity Image | No | |
| Favicon | `favicon` | Sanity Image | No | |

#### Section B: Contact

| Field | Key | Type | Required | Notes |
|-------|-----|------|----------|-------|
| Contact Email | `contactEmail` | string (email) | No | |
| Contact Phone | `contactPhone` | string | No | Max 30 chars |
| Contact Address | `contactAddress` | string | No | Max 300 chars |

#### Section C: SEO (Global)

| Field | Key | Type | Required | Notes |
|-------|-----|------|----------|-------|
| Global SEO Title | `globalSeoTitle` | string | No | Max 70 chars |
| Global SEO Description | `globalSeoDescription` | string | No | Max 160 chars |
| OG Image | `ogImage` | Sanity Image | No | Default social share image |

#### Section D: Analytics

| Field | Key | Type | Required | Notes |
|-------|-----|------|----------|-------|
| Google Analytics ID | `gaId` | string | No | Must match `^G-[A-Z0-9]+$` |

#### Section E: Social Links

| Field | Key | Type | Notes |
|-------|-----|------|-------|
| LinkedIn URL | `linkedinUrl` | string (URL) | Empty = does not render |
| Twitter/X URL | `twitterUrl` | string (URL) | |
| Facebook URL | `facebookUrl` | string (URL) | |
| Instagram URL | `instagramUrl` | string (URL) | |
| YouTube URL | `youtubeUrl` | string (URL) | |

#### Section F: Footer

| Field | Key | Type | Required | Notes |
|-------|-----|------|----------|-------|
| Footer Text | `footerText` | string | No | Copyright/tagline. Max 200 chars |
| Terms Page Link Label | `termsLabel` | string | No | Footer link label for /terms. Max 50 chars. Default fallback: "Terms of Use" |
| Privacy Page Link Label | `privacyLabel` | string | No | Footer link label for /privacy. Default fallback: "Privacy Policy" |
| Accessibility Page Link Label | `accessibilityLabel` | string | No | Default fallback: "Accessibility" |

#### Section G: Policy Pages Content

| Field | Key | Type | Required | Notes |
|-------|-----|------|----------|-------|
| Terms of Use Content | `termsContent` | Portable Text | No | If empty, /terms renders empty state |
| Privacy Policy Content | `privacyContent` | Portable Text | No | If empty, /privacy renders empty state |
| Accessibility Statement Content | `accessibilityContent` | Portable Text | No | If empty, /accessibility renders empty state |

#### Section H: Navigation Labels

All navigation labels are governed here. These fields have documented English fallback defaults (see §3.7.1) per DOC-000 §3.1.1.

| Field | Key | Type | Default Fallback | Notes |
|-------|-----|------|-----------------|-------|
| About Nav Label | `nav.aboutLabel` | string | "About" | Max 40 chars |
| Services Nav Label | `nav.servicesLabel` | string | "Services" | Max 40 chars |
| Portfolio Nav Label | `nav.portfolioLabel` | string | "Portfolio" | Max 40 chars |
| Insights Nav Label | `nav.insightsLabel` | string | "Insights" | Max 40 chars |
| Contact Nav Label | `nav.contactLabel` | string | "Contact" | Max 40 chars |
| Nav CTA Button Label | `nav.ctaLabel` | string | "Get in Touch" | Prominent nav CTA. Max 40 chars |

#### Section I: Homepage Section Labels

| Field | Key | Type | Default Fallback | Notes |
|-------|-----|------|-----------------|-------|
| About Section Heading | `home.aboutHeading` | string | — | If empty, section does not render heading |
| Services Section Heading | `home.servicesHeading` | string | — | Max 80 chars |
| Services Section Subheading | `home.servicesSubheading` | string | — | Max 200 chars |
| Portfolio Section Heading | `home.portfolioHeading` | string | — | Max 80 chars |
| Portfolio Section Subheading | `home.portfolioSubheading` | string | — | Max 200 chars |
| Testimonials Section Heading | `home.testimonialsHeading` | string | — | Max 80 chars |
| Insights Section Heading | `home.insightsHeading` | string | — | Max 80 chars |
| CTA Section Heading | `home.ctaHeading` | string | — | Max 120 chars |
| CTA Section Subheading | `home.ctaSubheading` | string | — | Max 250 chars |
| CTA Section Button Label | `home.ctaButtonLabel` | string | "Contact Us" | Max 50 chars |

#### Section J: Services Page Labels

| Field | Key | Type | Default Fallback | Notes |
|-------|-----|------|-----------------|-------|
| Services Page Heading | `services.pageHeading` | string | — | Max 80 chars |
| Services Page Subheading | `services.pageSubheading` | string | — | Max 200 chars |

#### Section K: Portfolio Page Labels

| Field | Key | Type | Default Fallback | Notes |
|-------|-----|------|-----------------|-------|
| Portfolio Page Heading | `portfolio.pageHeading` | string | — | Appears on portfolio hero |
| Portfolio Page Subheading | `portfolio.pageSubheading` | string | — | Max 200 chars |
| Portfolio Testimonials Heading | `portfolio.testimonialsHeading` | string | — | Section heading below hero |

#### Section L: Insights Page Labels

| Field | Key | Type | Default Fallback | Notes |
|-------|-----|------|-----------------|-------|
| Insights Page Heading | `insights.pageHeading` | string | — | Max 80 chars |
| Insights Page Subheading | `insights.pageSubheading` | string | — | Max 200 chars |

#### Section M: Contact Page Labels

All contact page text is governed here to satisfy the zero-hardcode principle.

| Field | Key | Type | Default Fallback | Notes |
|-------|-----|------|-----------------|-------|
| Contact Page Heading | `contact.pageHeading` | string | — | Max 80 chars |
| Contact Page Subheading | `contact.pageSubheading` | string | — | Max 200 chars |
| Form Name Label | `contact.formNameLabel` | string | "Your Name" | Max 60 chars |
| Form Email Label | `contact.formEmailLabel` | string | "Email Address" | Max 60 chars |
| Form Phone Label | `contact.formPhoneLabel` | string | "Phone (optional)" | Max 60 chars |
| Form Company Label | `contact.formCompanyLabel` | string | "Company (optional)" | Max 60 chars |
| Form Message Label | `contact.formMessageLabel` | string | "Message" | Max 60 chars |
| Form Submit Label | `contact.formSubmitLabel` | string | "Send Message" | Max 50 chars |
| Form Success Message | `contact.formSuccessMessage` | string | — | Shown after successful submission. Max 300 chars. If empty, section does not render |
| Form Error Message | `contact.formErrorMessage` | string | "Something went wrong. Please try again." | Max 300 chars |

#### Section N: Empty State Messages

Shown when a collection has no active content. If empty, the section renders a default empty container with no text.

| Field | Key | Type | Default Fallback | Notes |
|-------|-----|------|-----------------|-------|
| Services Empty State | `empty.servicesMessage` | string | — | Max 200 chars |
| Portfolio Empty State | `empty.portfolioMessage` | string | — | Max 200 chars |
| Insights Empty State | `empty.insightsMessage` | string | — | Max 200 chars |

#### Section O: 404 & Error Page

| Field | Key | Type | Default Fallback | Notes |
|-------|-----|------|-----------------|-------|
| 404 Heading | `error404.heading` | string | "Page Not Found" | Max 80 chars |
| 404 Message | `error404.message` | string | "The page you're looking for doesn't exist." | Max 300 chars |
| 404 CTA Label | `error404.ctaLabel` | string | "Go Home" | Max 50 chars |

#### Section P: System

| Field | Key | Type | Required | Notes |
|-------|-----|------|----------|-------|
| Updated At | `updatedAt` | datetime | Yes (system) | Set by API on every mutation |

#### 3.7.1 Default Fallback Policy

Fields marked with a documented "Default Fallback" in sections H and M above retain English defaults in code as structural fallbacks per DOC-000 §3.1.1. These defaults are:

1. Structural chrome only (navigation, form labels, submit buttons, error messages)
2. Never marketing copy or brand identity text
3. Explicitly listed in this table
4. Overridable through the CMS

All other text fields (section headings, body copy, page headings, CTAs, empty states) have NO hardcoded fallback. If empty, the element does not render.

**SiteSettings Invariants:**
- INV-028: `contactEmail` must pass email validation if provided
- INV-029: All URL fields must pass URL validation if provided
- INV-030: `gaId` must match `^G-[A-Z0-9]+$` if provided
- INV-037: Navigation label fields, if provided, must be non-empty strings within character limits
- INV-038: Form label fields, if provided, must be non-empty strings within character limits

---

## 4. Slug Uniqueness

Slug uniqueness is per entity type, not global. The same value may appear across different entity types.

| Entity | Scope |
|--------|-------|
| Service | Unique among all Services |
| Project | Unique among all Projects |
| Article | Unique among all Articles |

Slugs are immutable after creation.

---

## 5. System Timestamp Fields

| Field | Rule |
|-------|------|
| `createdAt` | Set by API on creation. Immutable. |
| `updatedAt` | Set by API on every mutation. Used as display timestamp. |
| `publishedAt` | Set by API on first Article publish. Immutable once set. |
| `archivedAt` | Set by API on Project/Testimonial archive. Cleared on restore. |

Client-supplied values for system timestamp fields are rejected.

---

## 6. Optimistic Concurrency

### 6.1 Primary Token: `_rev`

The primary optimistic concurrency token is Sanity's `_rev` field, managed by Sanity and updated atomically on every successful write.

**Flow:**
1. API includes `_rev` in every entity GET response
2. Client stores and submits `_rev` in mutation requests
3. API reads current `_rev` from Sanity before writing
4. `_rev` mismatch → `CONFLICT` error (409). No write attempted.
5. `_rev` match → proceed with write

### 6.2 Secondary Signal: `updatedAt`

`updatedAt` is retained for display purposes ("last modified" in the admin UI) and as a secondary diagnostic signal, but it is not the primary concurrency lock.

---

## 7. Invariant Registry

| ID | Entity | Rule |
|----|--------|------|
| INV-001 | Hero | `mediaType` must be `"image"` or `"video"` |
| INV-002 | Hero | `image` required when `mediaType === "image"` |
| INV-003 | Hero | `videoUrl` required when `mediaType === "video"` |
| INV-004 | Hero | `overlayOpacity` must be 0–100 if provided |
| INV-005 | Hero | `updatedAt` set by API only |
| INV-006 | About | `body` must be valid Portable Text array |
| INV-007 | About | `teamMember.order` non-negative integer |
| INV-008 | About | `teamMember.linkedinUrl` valid URL if provided |
| INV-009 | Service | `slug` unique among Services |
| INV-010 | Service | `slug` matches `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| INV-011 | Service | `isActive` defaults to false |
| INV-012 | Service | `order` non-negative integer |
| INV-013 | Project | `slug` unique among Projects |
| INV-014 | Project | `slug` matches `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| INV-015 | Project | `coverImage` required |
| INV-016 | Project | `isActive` defaults to false |
| INV-017 | Project | `technologies`: 1–20 strings if provided |
| INV-018 | Testimonial | `projectRef` required |
| INV-019 | Testimonial | `projectRef` references existing Project |
| INV-020 | Testimonial | `featuredOnPortfolio` defaults to false |
| INV-021 | Testimonial | `order` non-negative integer |
| INV-022 | Article | `slug` unique among Articles |
| INV-023 | Article | `slug` matches `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| INV-024 | Article | Cannot have `isDraft=true` AND `isPublished=true` |
| INV-025 | Article | Cannot have `isDraft=false` AND `isPublished=false` |
| INV-026 | Article | `publishedAt` set by API on first publish, immutable |
| INV-027 | Article | Only `isPublished:true` returned by public queries |
| INV-028 | SiteSettings | `contactEmail` valid email if provided |
| INV-029 | SiteSettings | URL fields valid URL if provided |
| INV-030 | SiteSettings | `gaId` matches `^G-[A-Z0-9]+$` if provided |
| INV-031 | Project | `isArchived` defaults to false |
| INV-032 | Project | `archivedAt` set by API on archive; cleared on restore |
| INV-033 | Testimonial | `isArchived` defaults to false |
| INV-034 | Testimonial | Archived when parent Project is archived (atomic) |
| INV-035 | Testimonial | Restored when parent Project is restored (atomic) |
| INV-036 | Testimonial | Permanently deleted when parent Project is hard-deleted (atomic) |
| INV-037 | SiteSettings | Nav label fields: non-empty strings within limits if provided |
| INV-038 | SiteSettings | Form label fields: non-empty strings within limits if provided |

---

## 8. Archive/Restore/Delete Lifecycle

### 8.1 Rationale

Testimonials carry client voice and represent business relationships. They are too valuable to destroy automatically on a single operator action. Projects are the anchor of the public portfolio — accidental deletion must be recoverable.

### 8.2 Project Lifecycle States

```
ACTIVE (isArchived: false, isActive: true/false)
   ↓ Archive
ARCHIVED (isArchived: true, isActive: false)
   ↓ Restore              ↓ Permanent Delete
ACTIVE                   [DESTROYED — irreversible]
```

### 8.3 Archive Behavior

When a Project is archived:
1. `isArchived` is set to `true`
2. `isActive` is forced to `false` (archived projects are never public)
3. `archivedAt` is set to current timestamp
4. All associated Testimonials: `isArchived = true`, `archivedAt = now()` — atomic transaction
5. Archived projects and testimonials do not appear in standard admin list views
6. Archived items are accessible via an explicit "Archive" view

### 8.4 Restore Behavior

When a Project is restored:
1. `isArchived` set to `false`
2. `archivedAt` cleared (null)
3. `isActive` remains false — operator must explicitly re-activate if desired
4. All associated Testimonials: `isArchived = false`, `archivedAt = null` — atomic transaction

### 8.5 Permanent Delete Behavior

Available only on archived Projects. Requires explicit secondary confirmation from the operator.

1. All associated Testimonials are permanently deleted from Sanity — atomic transaction
2. The Project document is permanently deleted from Sanity
3. This operation is irreversible and is governed as such in DOC-030 §5.5 and DOC-050 §5.5

### 8.6 Service and Article Deletion

Services and Articles do not have an archive model. They are hard-deleted with a single confirmation step. Services have no cascade dependencies. Articles have no cascade dependencies.

---

*End of document.*
