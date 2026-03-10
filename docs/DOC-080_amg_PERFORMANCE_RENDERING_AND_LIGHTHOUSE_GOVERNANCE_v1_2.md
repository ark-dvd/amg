# DOC-080 — AMG Performance, Rendering & Lighthouse Governance

**Status:** Canonical
**Effective Date:** March 10, 2026
**Version:** 1.2
**Timestamp:** 20260310-1321 (CST)
**Governing Documents:** DOC-000 — AMG System Charter (v1.1); DOC-010 — Architecture (v1.1); DOC-070 — SEO (v1.2)

---

### Revision History

| Version | Timestamp (CST) | Changes |
|---------|-----------------|---------|
| 1.0 | 20260310-1020 | Initial release |
| 1.1 | 20260310-1302 | §11 CDN and Cache Governance added — static asset immutable caching rules, HTML response cache-control headers, stale-content prohibition after verified mutations, ISR alignment requirement |
| 1.2 | 20260310-1321 | §12 Lighthouse CI Enforcement added — CI gate requirement, mobile/desktop runs, score threshold failure policy, verification environment rules; §7.2 ISR Failure Behavior rule added — stale-on-failure requirement, APP_ERROR log trigger |

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

Scores are measured in production. If field data (CrUX) diverges significantly from lab scores, field data governs.

### 2.3 Mobile Parity

Mobile must meet the same Core Web Vitals targets and Lighthouse score targets as desktop. Separate mobile and desktop Lighthouse runs are required for compliance verification.

### 2.4 Non-Negotiability

There are no exceptions based on content richness, feature complexity, or timeline pressure.

---

## 3. Image Governance

### 3.1 Required Renderer

All public-facing images must use `next/image`. HTML `<img>` elements prohibited on public pages.

### 3.2 Format Priority

Served in priority order by `next/image` automatically: AVIF → WebP → original format.

### 3.3 Responsive Sizes

Every `next/image` usage must include the `sizes` attribute reflecting actual rendered size at each breakpoint. Omitting `sizes` causes desktop-resolution downloads on mobile viewports.

Examples:
- Full-width hero: `sizes="100vw"`
- Half-width card: `sizes="(max-width: 768px) 100vw, 50vw"`
- Portfolio grid (3-column): `sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"`

The `sizes` attribute must be empirically verified for each image context.

### 3.4 Explicit Dimensions

All `next/image` usages must provide `width` + `height` or `fill` with a sized container. Missing dimensions cause layout shift.

### 3.5 Hero Media Constraints

**Hero image:**
- Source image minimum 1920×1080px
- Must use `priority` prop (LCP candidate)
- Must have non-empty `alt` text

**Hero video:**
- `videoPoster` field required (rendered immediately — LCP candidate)
- Video loads after poster is visible
- `autoPlay muted loop playsInline` attributes required
- Recommended video file size: ≤ 5 MB

### 3.6 Lazy Loading Policy

- Above-fold images: `priority` prop
- Below-fold images: default lazy loading
- Hero image and first portfolio cover image: above-fold, must use `priority`

### 3.7 Image Quality Setting

Default `next/image` quality: 80. Adjustable per deployment if visually insufficient, provided Lighthouse Performance target is maintained.

---

## 4. Script Governance

### 4.1 No Blocking Scripts in `<head>`

No `<script>` without `async` or `defer` permitted in `<head>` (excluding Next.js framework scripts managed automatically). Blocking scripts directly cause TBT violations.

### 4.2 Third-Party Script Policy

| Script Type | Required Strategy |
|------------|------------------|
| Google Analytics | `strategy="afterInteractive"` |
| Any other analytics | `strategy="afterInteractive"` |
| Marketing pixels | `strategy="lazyOnload"` |
| Chat widgets | `strategy="lazyOnload"` |

`strategy="beforeInteractive"` is prohibited for all third-party scripts.

### 4.3 Third-Party Script Audit

Permitted scripts per standard AMG deployment:
- Google Analytics (when `gaId` configured)
- Cloudflare Turnstile or reCAPTCHA (contact page only)

Any additional scripts require explicit charter amendment.

### 4.4 Google Analytics Non-Blocking

Loaded conditionally (only when `gaId` configured). Uses `strategy="afterInteractive"`. Must not contribute to TBT or LCP.

---

## 5. Font Loading

### 5.1 Font Display Strategy

All custom fonts: `font-display: swap`. Use `next/font` — not manual `<link>` tags.

### 5.2 Font Preloading

Critical fonts preloaded via `next/font` automatically. Manual preloading limited to primary font weights visible above the fold.

### 5.3 Maximum Font Weight Variants

- Body typeface: maximum 2 weights
- Heading typeface: maximum 2 weights
- Monospace: maximum 1 weight

### 5.4 Font Subsetting

Latin character set only. `next/font/google` handles subsetting automatically.

---

## 6. Bundle Discipline

### 6.1 Server Components First

Client Components (`"use client"`) permitted only when: browser-only APIs required, React hooks require client state, or event listeners are needed. Server Component is the default. Client Component requires justification.

### 6.2 Dynamic Imports

Large non-initial-render components use `next/dynamic`. Candidates: Portable Text editor (Back Office), video player modal, image gallery lightbox.

### 6.3 Page Bundle Limits (Guidance)

| Bundle Type | Target |
|-------------|--------|
| First Load JS (shared) | ≤ 100KB gzipped |
| Per-page JS | ≤ 50KB gzipped |
| Total page weight | ≤ 500KB |

### 6.4 Tree Shaking

Named imports only. No namespace imports. Icon libraries import only used icons.

---

## 7. SSR and Data Fetching

### 7.1 `useCdn: false` for SSR

Per DOC-010 §4.1. All Sanity reads on public pages use `useCdn: false`.

### 7.2 Revalidation Policy

| Page Type | Strategy |
|-----------|----------|
| Homepage | `revalidate: 60` |
| Listing pages | `revalidate: 60` |
| Entity detail pages | `revalidate: 300` |
| SiteSettings-dependent elements | `revalidate: 60` |

On-demand revalidation via `revalidatePath()` or `revalidateTag()` is triggered by the admin API after every verified successful mutation. This ensures the public site reflects operator changes within seconds.

### 7.2.1 ISR Failure Behavior

If an ISR background regeneration attempt fails — due to a Sanity read error, network timeout, or any other cause — the previously cached version of the page must continue to be served to visitors. ISR failure must never surface as a `500` or error page to public visitors.

**Binding rules:**

- A failed ISR regeneration does not invalidate the existing cached page. The cached page remains live and continues to be served until a successful regeneration replaces it.
- The `stale-while-revalidate` CDN behavior (DOC-080 §11.3) reinforces this at the CDN layer — a stale cached response is served while regeneration is attempted.
- Every ISR regeneration failure must generate an `APP_ERROR` log entry (DOC-090 §4.6) with `route` set to the path that failed to regenerate and `errorMessage` describing the failure cause. This log entry is the operational signal that a page may be serving stale content.
- ISR regeneration failures do not trigger on-demand revalidation retries automatically. If the failure persists, the operator or developer must investigate via the `APP_ERROR` log and resolve the underlying cause before the page regenerates successfully.

### 7.3 Static Generation

All public routes use ISR with `generateStaticParams` for known active/published entities. New content published after build is served via ISR on first request.

### 7.4 No Waterfalling Data Fetches

All required data for a page is fetched concurrently using `Promise.all()`. Sequential awaits that could be parallelized are a performance defect.

---

## 8. CSS and Styling

### 8.1 Tailwind CSS Configuration

`content` paths include all application files. Unused CSS purged automatically. The final CSS bundle must not include unused Tailwind classes.

### 8.2 No CSS-in-JS with Runtime Overhead

Runtime CSS-in-JS libraries are prohibited. Tailwind CSS utility classes are the governed styling mechanism.

---

## 9. Mobile Performance

### 9.1 Same Targets as Desktop

Mobile performance targets are identical to desktop.

### 9.2 Responsive Images

`sizes` attribute (§3.3) is the primary mechanism for appropriately sized mobile images.

### 9.3 Touch Performance

- No scroll-blocking event listeners
- CSS transitions use `transform` and `opacity` only (GPU-accelerated)
- `will-change` used sparingly

### 9.4 Viewport Configuration

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

No `maximum-scale` or `user-scalable=no` — these are accessibility violations.

---

## 10. Compliance Checklist

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
| 18 | Page data fetches are parallelized |
| 19 | No runtime CSS-in-JS |
| 20 | Mobile Lighthouse scores meet same targets as desktop |
| 21 | `next build` output within §6.3 bundle guidance |
| 22 | Static assets served with `Cache-Control: public, max-age=31536000, immutable` | 
| 23 | HTML responses served with `Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=60` |
| 24 | On-demand revalidation clears CDN cache on content mutations |
| 25 | No stale content visible after verified successful mutation |
| 26 | Lighthouse CI configured in repository (`lighthouserc.js`) |
| 27 | Lighthouse CI runs on every production build (desktop + mobile) |
| 28 | Lighthouse CI gates deployment — failing build does not promote to production |
| 29 | Lighthouse CI runs against production build artifact, not dev server |
| 30 | ISR failure serves stale page (no 500 to visitors) and generates APP_ERROR log |

---

## 11. CDN and Cache Governance

### 11.1 Governing Principle

CDN caching must accelerate content delivery without ever causing a visitor to see stale content after an operator has successfully published a change. These two requirements — maximum cache efficiency and zero post-mutation staleness — are both binding. Neither may be sacrificed for the other.

### 11.2 Static Asset Caching

All static assets — JavaScript bundles, CSS files, fonts, and build-time images — must be served with:

```http
Cache-Control: public, max-age=31536000, immutable
```

**Rules:**

- All static assets must use content-hashed filenames generated by the Next.js build system (e.g. `_next/static/chunks/[hash].js`). Content-hashing is the default behavior of `next build` and must not be disabled.
- Cache busting occurs automatically through build hashes. When a deployment updates a static asset, its filename changes, invalidating all prior cache entries at the CDN and browser levels without any manual purge.
- Static assets must never be served without the `immutable` directive. Serving static assets without `immutable` causes browsers to issue unnecessary revalidation requests on navigation, degrading performance.
- The 1-year `max-age=31536000` is the correct value for content-hashed assets. A shorter TTL for static assets is a performance defect.

### 11.3 HTML Response Caching

HTML responses — the server-rendered or ISR-generated page payloads — must be served with:

```http
Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=60
```

**Rules:**

- `max-age=0` ensures the browser always revalidates with the CDN before serving a cached HTML response. Browser-cached HTML that is stale after a content update is unacceptable.
- `s-maxage=60` instructs the CDN to cache HTML for up to 60 seconds. This value aligns with the ISR `revalidate: 60` setting (DOC-080 §7.2). The CDN freshness window must never exceed the ISR revalidation window — a CDN that caches HTML longer than ISR regenerates it will serve content that ISR has already refreshed.
- `stale-while-revalidate=60` allows the CDN to serve a stale response while regenerating in the background, preventing cache misses from causing user-visible latency spikes during regeneration.
- HTML must never be cached with the `immutable` directive. HTML content changes with every content mutation and must be re-evaluated at the CDN layer.

### 11.4 API Response Caching

Admin API responses (`/api/admin/*`) must not be cached at the CDN layer:

```http
Cache-Control: no-store
```

Public API responses (`/api/public/*`) may use short-lived caching where appropriate, but `/api/public/contact` must be `no-store` as it processes unique per-request submissions.

### 11.5 Post-Mutation Cache Invalidation

Verified mutations in the admin API trigger on-demand cache invalidation of the affected public paths via `revalidatePath()` or `revalidateTag()` (§7.2). This is the mechanism by which the CDN cache is cleared immediately after a successful content change, rather than waiting for the TTL to expire.

**Binding rule:** A visitor must never see content on the public site that contradicts a successfully persisted mutation for longer than the time required for a CDN edge node to acknowledge the revalidation signal — typically under 5 seconds in practice. The architectural guarantee is: mutation verified by read-back → revalidation triggered → CDN invalidated → next visitor request served with fresh content.

**Prohibited behavior:** A system where the operator saves a change, the API returns `success: true`, and a visitor on the public site still sees the old content 60+ seconds later — because the CDN TTL has not yet expired and on-demand revalidation was not triggered — is non-compliant.

### 11.6 Cache Header Implementation

Cache headers are set in `next.config.js` `headers()` configuration. They are not set per-route in route handlers (where they could be inconsistent or omitted). The global header rules apply uniformly and cannot be overridden by individual route implementations.

Exception: API route handlers may set `Cache-Control: no-store` explicitly as an additional safeguard, provided it does not conflict with the `next.config.js` rules.

---

## 12. Lighthouse CI Enforcement

### 12.1 Governing Principle

Lighthouse score targets (§2.2) are binding requirements. Manual verification is insufficient for a production system — scores degrade silently as code changes accumulate. Lighthouse CI enforcement makes score regression a build failure, not a post-deployment discovery.

### 12.2 CI Requirement

Lighthouse CI must run on every production build. A build that fails any Lighthouse threshold must fail CI and must not be promoted to production. Passing Lighthouse CI is a required gate in the deployment pipeline, equivalent in weight to passing automated tests or a TypeScript build.

### 12.3 Run Configuration

Two Lighthouse runs are required per build:

| Run | Device Emulation | Purpose |
|-----|-----------------|---------|
| Desktop | Desktop viewport, no throttling | Desktop score gate |
| Mobile | Mobile viewport, standard mobile throttling | Mobile score gate |

Both runs must pass independently. A build that passes desktop but fails mobile is a failing build. A build that passes mobile but fails desktop is a failing build.

### 12.4 Score Thresholds

Thresholds enforced in CI mirror the binding targets in §2.2:

| Category | Minimum Score |
|----------|--------------|
| Performance | 95 |
| Accessibility | 95 |
| Best Practices | 95 |
| SEO | 95 |

Any category scoring below 95 on either the desktop or mobile run fails the CI gate.

### 12.5 Verification Environment

Lighthouse CI must run against **production build artifacts** — the output of `next build` — not against the development server. Lighthouse scores against `next dev` are unreliable and do not reflect production rendering behavior.

The recommended approach: build the production bundle, serve it locally with `next start` or a local static server, and run Lighthouse CI against the local production server. Alternatively, run Lighthouse CI against a staging deployment that is built from the same production build pipeline.

Under no circumstances is Lighthouse CI considered satisfied by:
- Manual Lighthouse runs in Chrome DevTools
- Scores measured against the development server
- Scores from a prior build carried forward without a new run

### 12.6 Tooling

The recommended tool is `@lhci/cli` (Lighthouse CI). Configuration is stored in `lighthouserc.js` or `.lighthouserc.json` at the repository root. The configuration file defines: URLs to audit, thresholds per category, number of runs per URL (minimum 3, median score used), and device emulation settings.

A minimum of 3 Lighthouse runs per URL per CI execution is required to reduce score variance. The median score across runs is used for threshold evaluation.

### 12.7 Scope of Pages Audited

At minimum, the following pages are included in every CI Lighthouse run:

- `/` (Homepage)
- `/services` (Services listing)
- `/portfolio` (Portfolio listing)
- `/insights` (Insights listing)
- `/contact` (Contact page)

At least one entity detail page from each collection must also be included (e.g. one service detail, one project detail, one article detail), using representative content from the deployment's Content Store.

---

*End of document.*
