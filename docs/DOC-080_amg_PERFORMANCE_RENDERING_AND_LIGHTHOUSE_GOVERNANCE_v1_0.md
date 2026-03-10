# DOC-080 — AMG Performance, Rendering & Lighthouse Governance

**Status:** Canonical
**Effective Date:** March 10, 2026
**Version:** 1.0
**Timestamp:** 20260310-1020 (CST)
**Governing Documents:** DOC-000 — AMG System Charter (v1.1); DOC-010 — Architecture (v1.1); DOC-070 — SEO (v1.1)

---

### Revision History

| Version | Timestamp (CST) | Changes |
|---------|-----------------|---------|
| 1.0 | 20260310-1020 | Initial release |

---

### Document Standards

Canonical documents are written in English. All timestamps use Central Standard Time (CST).

---

## 1. Executive Intent

Performance is not an optimization phase. It is a governing constraint that applies at the architecture layer, the implementation layer, and the deployment layer simultaneously.

A project management company's public website is a first-impression surface. A slow page communicates the opposite of professional execution. A site that passes Lighthouse on desktop but fails on mobile communicates that mobile users are second-class. Both are unacceptable.

The targets defined in this document are binding. A deployment that does not meet these targets is not production-ready, regardless of whether all features are implemented.

This document governs the public-facing website. Back Office performance requirements are subordinate — the Back Office must be operationally usable on all target devices, but it is not subject to the same Lighthouse targets as the public site.

---

## 2. Performance Targets

### 2.1 Core Web Vitals

These targets apply to every public page on both desktop and mobile:

| Metric | Target | Category |
|--------|--------|---------|
| Largest Contentful Paint (LCP) | ≤ 2.5 seconds | Good |
| Cumulative Layout Shift (CLS) | ≤ 0.1 | Good |
| Total Blocking Time (TBT) | ≤ 200ms | Good |
| Interaction to Next Paint (INP) | ≤ 200ms | Good |
| First Contentful Paint (FCP) | ≤ 1.8 seconds | Good |

### 2.2 Lighthouse Score Targets

| Category | Minimum Score |
|----------|--------------|
| Performance | ≥ 95 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 95 |

Scores are measured in production using Lighthouse CI or equivalent tooling. Lab scores and field data are both considered. If field data (CrUX) diverges significantly from lab scores, field data governs.

### 2.3 Mobile Parity

Mobile must meet the same Core Web Vitals targets and Lighthouse score targets as desktop. Mobile is not permitted to score lower by design. Separate mobile and desktop Lighthouse runs are required for compliance verification.

### 2.4 Non-Negotiability

There are no exceptions to these targets based on content richness, feature complexity, or timeline pressure. A page with a hero video and complex portfolio grid must still achieve LCP ≤ 2.5s. Implementation must be designed to meet the targets, not the other way around.

---

## 3. Image Governance

### 3.1 Required Renderer

All public-facing images must be rendered using Next.js `next/image`. HTML `<img>` elements are prohibited on public pages. `next/image` provides:
- Automatic WebP and AVIF format delivery (format selected per browser capability)
- Responsive `srcset` generation
- Lazy loading by default
- CLS prevention via reserved layout space

### 3.2 Format Priority

Image formats are served in the following priority order, determined automatically by `next/image`:
1. AVIF (smallest file size, widest color gamut)
2. WebP (broad support, significant size reduction over JPEG/PNG)
3. Original format (JPEG, PNG) as fallback

No manual format selection is required in application code. This behavior is the default when `next/image` is used with Sanity image URLs.

### 3.3 Responsive Sizes

Every `next/image` usage must include the `sizes` attribute reflecting the image's actual rendered size at each breakpoint. Omitting `sizes` causes the browser to download full-size images for mobile viewports.

Examples:
- Full-width hero: `sizes="100vw"`
- Half-width card: `sizes="(max-width: 768px) 100vw, 50vw"`
- Portfolio grid (3-column desktop): `sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"`

The `sizes` attribute must be empirically verified for each image context — not approximated.

### 3.4 Explicit Dimensions

All `next/image` usages must provide either:
- Explicit `width` and `height` props (for images with known intrinsic dimensions), or
- `fill` prop with a sized parent container

Missing dimensions cause layout shift and degrade both CLS and Lighthouse Performance.

### 3.5 Hero Media Constraints

The hero section on the homepage and portfolio page uses either a full-screen image or a video. Both must meet LCP requirements.

**Hero image rules:**
- Source image must be uploaded at minimum 1920×1080px
- Served at 1200×800 for desktop, 800×600 for tablet, 600×400 for mobile (via `sizes`)
- Must use `priority` prop (not lazy-loaded — it is the LCP candidate)
- Must have explicit `alt` text (not empty)

**Hero video rules:**
- A poster image (`videoPoster` field from DOC-020 §3.1) is required for video heroes
- The poster image is rendered immediately (it is the LCP candidate, not the video)
- The video element loads after the poster is visible
- Video must not autoplay with sound — `autoPlay muted loop playsInline` attributes required
- Video file size recommendation: ≤ 5 MB for primary format. Operator responsibility.
- Video must be served from a reliable CDN (Sanity CDN or external provider configured per deployment)

### 3.6 Lazy Loading Policy

- All images **above the fold** (visible on initial load without scrolling): `priority` prop, no lazy loading
- All images **below the fold**: default lazy loading behavior (no prop needed — `next/image` defaults to lazy)
- Hero image and first portfolio project cover image (on listing page): treated as above-the-fold, must use `priority`

### 3.7 Image Quality Setting

Default `next/image` quality setting: 80 (sufficient quality, significant size reduction). Adjustable per deployment if quality is visually insufficient, but must not degrade Lighthouse Performance below target.

---

## 4. Script Governance

### 4.1 No Blocking Scripts in `<head>`

No `<script>` tag without `async` or `defer` is permitted in the document `<head>` (other than Next.js's own framework scripts which are managed automatically).

Blocking scripts in `<head>` directly cause TBT violations and are a category-1 Lighthouse Best Practices failure.

### 4.2 Third-Party Script Policy

Third-party scripts are loaded using Next.js `<Script>` component with the following strategy rules:

| Script Type | Required Strategy | Notes |
|------------|------------------|-------|
| Google Analytics | `strategy="afterInteractive"` | Loads after page is interactive |
| Any other analytics | `strategy="afterInteractive"` | |
| Marketing pixels | `strategy="lazyOnload"` | Loads during browser idle |
| Chat widgets | `strategy="lazyOnload"` | |
| Social share buttons (if any) | `strategy="lazyOnload"` | |

`strategy="beforeInteractive"` is prohibited for all third-party scripts.

### 4.3 Third-Party Script Audit

Every third-party script added to the system must be explicitly justified and listed in the deployment configuration. An unlisted third-party script is a performance violation. The permitted list per standard AMG deployment:
- Google Analytics (if `gaId` configured in SiteSettings)
- Cloudflare Turnstile or reCAPTCHA (contact page only)

Any additional scripts require explicit charter amendment.

### 4.4 Google Analytics Non-Blocking

Google Analytics is loaded conditionally (only when `gaId` is configured). It uses `strategy="afterInteractive"`. It must not contribute to TBT or LCP. GA4 measurement protocol is the preferred implementation over gtag.js where applicable.

### 4.5 Inline Script Discipline

Inline `<script>` blocks in page components are minimized. Where inline scripts are required (e.g. for critical CSS or font loading hints), they must be:
- Minimal in size (< 1KB)
- Free of external network requests
- Documented with a comment explaining why they cannot be deferred

---

## 5. Font Loading

### 5.1 Font Display Strategy

All custom fonts must be loaded with `font-display: swap`. This ensures text remains visible during font loading using system fallback fonts, preventing invisible text (FOIT) which degrades both LCP and Lighthouse Accessibility.

### 5.2 Font Preloading

Critical fonts (the primary body and heading typefaces) must be preloaded:

```html
<link rel="preload" href="/fonts/[font-file].woff2" as="font" type="font/woff2" crossorigin />
```

Preloading is limited to the primary font weights used above the fold. Preloading all font variants is counterproductive (wastes bandwidth).

Next.js `next/font` handles font loading, preloading, and `font-display` automatically when used correctly. Use of `next/font` is required over manual `<link>` tags.

### 5.3 Maximum Font Weight Variants

Loading excessive font weight variants is a common performance regression. The maximum permitted font weight variants per typeface:

- Body typeface: maximum 2 weights (regular + bold, or regular + medium)
- Heading typeface: maximum 2 weights
- Monospace (code): maximum 1 weight

If a design requires more variants, a waiver is required with Lighthouse Performance score verification confirming targets are still met.

### 5.4 Font Subsetting

Fonts must be subset to include only the Latin character set. Full Unicode font files are not acceptable for an English-only site. `next/font/google` handles subsetting automatically for Google Fonts.

---

## 6. Bundle Discipline

### 6.1 Server Components First

Next.js App Router defaults to Server Components. Client Components (`"use client"`) are permitted only when:
- The component requires browser-only APIs (window, document, etc.)
- The component requires React hooks that depend on client state (useState, useEffect, etc.)
- The component requires event listeners

Server Components have zero JavaScript sent to the client. Client Components contribute to the JavaScript bundle. The default is Server Component. Client Component is the exception that requires justification.

### 6.2 Dynamic Imports

Large components that are not required for the initial render must use dynamic imports with `next/dynamic`:

```typescript
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  loading: () => <p>Loading editor...</p>,
  ssr: false
});
```

Candidates for dynamic import include: Portable Text editor (Back Office only), video player modal, image gallery lightbox.

### 6.3 Page Bundle Limits

These are guidance targets, not hard failures. However, exceeding them requires investigation:

| Bundle Type | Target |
|-------------|--------|
| First Load JS (shared) | ≤ 100KB gzipped |
| Per-page JS | ≤ 50KB gzipped |
| Total page weight (HTML + CSS + JS + critical assets) | ≤ 500KB |

These are measured using `next build` output and Lighthouse network waterfall.

### 6.4 Tree Shaking

All imports use named imports, not namespace imports, to enable effective tree shaking:

```typescript
// Correct
import { format } from 'date-fns';

// Incorrect — imports entire library
import * as dateFns from 'date-fns';
```

Icon libraries (Lucide React) must import only the icons used:
```typescript
import { ArrowRight, Menu } from 'lucide-react';
// Not: import * as Icons from 'lucide-react';
```

---

## 7. SSR and Data Fetching

### 7.1 `useCdn: false` for SSR

Per DOC-010 §4.1, public pages retrieve content from Sanity with `useCdn: false`. This ensures SSR pages render with the authoritative dataset, not a potentially stale CDN-cached version. This is a correctness requirement, not only a performance consideration.

### 7.2 Revalidation Policy

Next.js `fetch` revalidation strategy for public pages:

| Page Type | Revalidation Strategy | Rationale |
|-----------|----------------------|-----------|
| Homepage (static sections) | `revalidate: 60` (60 seconds) | Acceptable staleness for typical content update frequency |
| Service/Project/Article listings | `revalidate: 60` | |
| Service/Project/Article detail pages | `revalidate: 300` (5 minutes) | Individual pages change less frequently |
| SiteSettings-dependent elements | `revalidate: 60` | Nav, footer, global settings |

**On-demand revalidation:** When an operator publishes, activates, or deactivates content in the Back Office, the relevant Next.js cache paths are purged immediately via Next.js `revalidatePath()` or `revalidateTag()`. This is invoked from the admin API routes after a verified successful mutation (post-read-back). On-demand revalidation ensures the public site reflects changes within seconds of operator action, not after the next TTL expiry.

### 7.3 Static Generation vs. Server-Side Rendering

| Route Type | Rendering Strategy |
|-----------|-------------------|
| `/` | ISR (Incremental Static Regeneration) |
| `/about` | ISR |
| `/services` | ISR |
| `/services/[slug]` | ISR with `generateStaticParams` for known active services |
| `/portfolio` | ISR |
| `/portfolio/[slug]` | ISR with `generateStaticParams` for known active projects |
| `/insights` | ISR |
| `/insights/[slug]` | ISR with `generateStaticParams` for known published articles |
| `/contact`, `/terms`, `/privacy`, `/accessibility` | ISR |
| `/admin/*` | Server-rendered (always fresh, authenticated) |

`generateStaticParams` pre-generates static pages at build time for known content. New content published after build is served via ISR on first request and cached thereafter.

### 7.4 No Waterfalling Data Fetches

Public page data fetches must be parallel, not sequential. All required data for a page is fetched concurrently using `Promise.all()` or equivalent. Sequential awaits that could be parallelized are a performance defect.

---

## 8. CSS and Styling

### 8.1 Tailwind CSS Configuration

Tailwind CSS is configured with `content` paths that include all application files. Unused CSS is purged automatically via PurgeCSS (built into Tailwind). The final CSS bundle must not include unused Tailwind classes.

### 8.2 Critical CSS

Next.js automatically inlines critical CSS for each page. No additional manual critical CSS extraction is required. However, CSS that is not used above-the-fold must not be forced into the critical path.

### 8.3 No CSS-in-JS with Runtime Overhead

CSS-in-JS libraries that generate styles at runtime (e.g. styled-components without SSR configuration, Emotion without static extraction) are prohibited. Tailwind CSS utility classes are the governed styling mechanism.

---

## 9. Mobile Performance

### 9.1 Same Targets as Desktop

Mobile performance targets (§2.1 and §2.2) are identical to desktop. There is no lower bar for mobile.

### 9.2 Responsive Images

The `sizes` attribute on all images (§3.3) is the primary mechanism for delivering appropriately sized images to mobile devices. Mobile viewports must not download desktop-resolution images.

### 9.3 Touch Performance

- No scroll event listeners that block scrolling
- CSS transitions for hover/active states use `transform` and `opacity` only (GPU-accelerated properties, avoid `box-shadow`, `width`, `height` transitions)
- `will-change` is used sparingly and removed after the transition completes

### 9.4 Viewport Configuration

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

No `maximum-scale` or `user-scalable=no` — these prevent user zoom and are an accessibility violation.

---

## 10. Compliance Checklist

Before any public page is considered production-ready:

| # | Requirement |
|---|-------------|
| 1 | Lighthouse Performance ≥ 95 (mobile and desktop) |
| 2 | Lighthouse Accessibility ≥ 95 |
| 3 | Lighthouse Best Practices ≥ 95 |
| 4 | Lighthouse SEO ≥ 95 |
| 5 | LCP ≤ 2.5s on mobile and desktop |
| 6 | CLS ≤ 0.1 on all pages |
| 7 | TBT ≤ 200ms on all pages |
| 8 | All public images use `next/image` |
| 9 | All `next/image` usages include `sizes` attribute |
| 10 | Hero image uses `priority` prop |
| 11 | Hero video has `videoPoster` image |
| 12 | No blocking `<script>` tags in `<head>` |
| 13 | Google Analytics uses `strategy="afterInteractive"` |
| 14 | All fonts use `next/font` with `font-display: swap` |
| 15 | Maximum 2 font weight variants per typeface |
| 16 | All Sanity reads use `useCdn: false` |
| 17 | On-demand revalidation triggered after successful mutations |
| 18 | Page data fetches are parallelized (no waterfalls) |
| 19 | No runtime CSS-in-JS |
| 20 | Mobile Lighthouse scores meet same targets as desktop |
| 21 | `next build` output shows page bundles within §6.3 guidance |

---

*End of document.*
