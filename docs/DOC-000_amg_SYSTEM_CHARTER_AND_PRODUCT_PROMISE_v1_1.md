# DOC-000 — AMG System Charter & Product Promise

**Status:** Canonical
**Effective Date:** March 9, 2026
**Version:** 1.1
**Timestamp:** 20260309-1555 (CST)

---

### Revision History

| Version | Timestamp (CST) | Changes |
|---------|-----------------|---------|
| 1.0 | 20260309-1532 | Initial release |
| 1.1 | 20260309-1555 | Added §3 Governing Principles (Zero Hard-Coded Text, Security First-Class, Mobile First-Class, Google-Grade SEO); added policy pages to §5 page inventory; expanded §8 Quality Bar with security, SEO, and mobile binding requirements; added DOC-060 and DOC-070 to document hierarchy in §11 |

---

### Document Standards

Canonical documents are written in English. All timestamps use Central Standard Time (CST). Version numbers are assigned only upon founder approval.

---

## 1. Executive Intent

AMG is a white-label digital presence template for project management companies. It is not a prototype, a mockup, or a demo. It is production-grade infrastructure designed to be cloned, configured, and deployed for each client.

This charter exists because websites built without governing specifications produce predictable failures: hard-coded content that cannot be changed without developer intervention, administrative panels that accept input but do not persist it, and a widening gap between what the site appears to do and what it actually does.

That ends here.

This document establishes the canonical definition of what AMG is, what it must do, what it must never do, and the quality standard against which every implementation decision will be measured.

All design decisions, implementation work, feature additions, and operational changes must conform to the definitions and constraints established herein. When conflicts arise between this document and any other specification, design document, implementation artifact, or verbal agreement, this document prevails unless it is formally revised through documented change control.

No convenience, deadline pressure, or expedient workaround supersedes this charter.

---

## 2. What AMG Is

AMG serves two simultaneous roles within a single deployment:

### 2.1 Public Marketing Website

AMG is the public-facing digital presence of a project management company. It presents the business to prospective clients, explains services offered, displays completed work, publishes thought leadership content, and provides a mechanism for inbound inquiries.

The site presents the following categories of information:

- **About:** The company's identity — background, team, methodology, and values.
- **Services:** The full range of professional offerings, each with a dedicated detail page.
- **Portfolio:** Completed projects with dedicated detail pages including scope, technologies, outcomes, and client testimonials.
- **Insights:** Thought leadership articles, guides, and educational content demonstrating expertise.
- **Contact:** The primary conversion point — a contact form for inquiries along with direct contact information.

### 2.2 Operational Content Management System

AMG includes a protected administrative interface — the Back Office — through which the operator manages all public-facing content.

The Back Office is not decorative. If an administrative route exists, it must authenticate correctly, persist changes to durable storage, reflect persisted state on reload, and surface errors honestly when operations fail. An admin panel that accepts input but does not save it, or displays controls that do not affect system behavior, is a defect — not a feature in progress.

### 2.3 White-Label Deployment Template

AMG is a generic template designed for replication. Each client receives a dedicated deployment derived from a common canonical codebase. The delivery model is: clone, configure, deploy. Each deployment is independent and complete.

AMG is not a shared runtime platform. It is not a multi-tenant SaaS system. Each deployment serves exactly one company. There is no shared operational state between deployments.

---

## 3. Governing Principles

These principles are binding. They are not aspirational. Any implementation decision that contradicts them is non-compliant.

### 3.1 Zero Hard-Coded Public Text

No user-facing text visible to public site visitors may be hard-coded in source files. This constraint is absolute and applies to all of the following surfaces:

- Page headlines and subheadlines
- Body copy and section text
- Navigation labels (desktop and mobile)
- CTA labels and button text
- Form field labels, placeholders, and helper text
- Form submit button labels
- Success and error messages on forms
- Section headings (services section title, portfolio section title, etc.)
- Footer text and copyright copy
- Empty state messages
- 404 and error page content
- Social and contact section labels
- Legal and policy page content (Terms, Privacy, Accessibility)
- SEO metadata (titles, descriptions)
- Open Graph and social sharing text
- Alt text defaults and image captions

**Permitted exception:** Pure system strings that are never visible to public site visitors (internal error codes, log messages, API identifiers) may remain in code. Any text that a public visitor could read is governed by this principle.

**Default behavior rule:** When a CMS text field is empty, the corresponding UI element does not render rather than falling back to hardcoded text — with the exception of structural UI chrome (§3.1.1).

#### 3.1.1 Structural UI Chrome Exception

Navigation structural elements (e.g. hamburger icon aria labels, "Skip to content" links) and form validation error messages that are purely technical (e.g. "This field is required") may have hardcoded English defaults in code, provided they are:

1. Explicitly listed in DOC-020 §3.7 as governed fields with documented fallbacks
2. Overridable through the CMS
3. Never marketing copy

These exceptions are narrow and must be formally listed. Any text that carries brand, marketing, or identity weight is not eligible for this exception.

### 3.2 Security Is First-Class

Security is not a phase-two concern. It is a governing constraint applied at every layer — authentication, API design, content rendering, file handling, session management, and deployment configuration. Security requirements are specified in DOC-060. All implementation must comply with DOC-060 before any route is considered production-ready.

### 3.3 Mobile Is First-Class

Mobile is not a cosmetic adaptation of the desktop experience. The public site and the Back Office must both be designed mobile-first. Performance, layout, navigation, form usability, and touch interaction must be explicitly governed and tested at every breakpoint. The mobile public site and mobile back office are subject to the same quality bar as their desktop equivalents. Mobile breakpoint requirements are governed in DOC-050.

### 3.4 Google-Grade SEO and Indexability

Every public page must be designed for correct, complete, and intentional Google indexability. SEO is not a post-launch concern. Metadata, structured data, canonical URLs, sitemap, robots behavior, and Open Graph tags are governing requirements. These are specified in DOC-070. All pages are considered non-compliant until DOC-070 requirements are satisfied.

### 3.5 Admin Resembles the Public Site

The Back Office must be structured to resemble the public site as closely as is operationally practical. The sidebar navigation should be organized by page, not by entity type. An operator editing the Homepage should see the page's sections in the order they appear on the live site. An operator editing the Portfolio page should see the Portfolio layout. Non-technical operators must be able to understand intuitively what they are editing without reference to documentation.

---

## 4. What AMG Is Not

The following behaviors are explicitly prohibited. Their presence in any deployment constitutes a defect requiring remediation.

**Not a demo or prototype.** AMG is production software representing a real business. Placeholder content, stubbed functionality, and "happy path only" implementations are unacceptable.

**Not a cosmetic admin shell.** If an admin route exists, it must function completely. A form that accepts input but does not persist it is worse than no form at all.

**Not a hard-coded marketing site.** Per §3.1, no visible content on the public site may be hard-coded in source files.

**Not a system that mutates state silently.** No operation may change persisted data without explicit user initiation and observable confirmation.

**Not a system that saves partially.** When the operator initiates a save, either all intended changes persist successfully or none do.

**Not a system that claims success on failure.** If an operation fails, the system must communicate that failure. Success indicators on failed operations are the most dangerous class of defect.

**Not a CRM.** AMG does not capture, track, or manage leads or client relationships. Contact form submissions are not stored in any database. Any future CRM capability requires a formal charter revision.

**Not a pricing or billing platform.** AMG does not display pricing information, handle invoices, or process payments.

**Not a multi-language platform.** AMG is English-only. RTL support, localization, and translation systems are outside scope.

---

## 5. Primary User Personas

### 5.1 AMG Operator

The primary administrative user. Manages all website content — updates service descriptions, adds portfolio projects, publishes articles, configures site settings, and maintains the operational state of the system. This user may not be technically specialized. They must not be required to interact with source code, database consoles, or deployment infrastructure to accomplish routine operational tasks.

The operator expects: changes save reliably, the admin reflects current persisted state on every load, and the system never lies about what it did.

### 5.2 Prospective Client

A visitor evaluating whether to engage the company for project management services. They read service descriptions, review the project portfolio, read testimonials, browse articles, and may submit an inquiry.

The prospect expects: accurate and professional information, a responsive and polished presentation across devices, and a contact form that works.

---

## 6. Public Page Inventory

The following pages constitute the public-facing AMG website. All content is sourced exclusively from the Content Store.

| Route | Description |
|-------|-------------|
| `/` | Homepage — Hero (full-screen image or video + headline + CTA), about preview, services overview, featured projects, featured testimonials, latest insights, CTA section |
| `/about` | About the company — background, team, methodology, values |
| `/services` | Service listing page |
| `/services/[slug]` | Individual service detail page |
| `/portfolio` | Portfolio listing page — Hero full-screen section, project grid, featured testimonials beneath Hero |
| `/portfolio/[slug]` | Individual project detail page — scope, technologies, outcomes, linked testimonials |
| `/insights` | Article listing page |
| `/insights/[slug]` | Individual article page |
| `/contact` | Contact form + direct contact information |
| `/terms` | Terms of use — managed via CMS rich text |
| `/privacy` | Privacy policy — managed via CMS rich text |
| `/accessibility` | Accessibility statement — managed via CMS rich text |

### 6.1 Content Rules

Every page renders content exclusively from the Content Store. If the Content Store returns no data for a content section, that section does not render. It does not render demo content. It does not render hardcoded fallback text. It renders truth or nothing.

### 6.2 Protected Routes

All `/admin/*` routes are protected and must never be indexed by search engines. All API routes under `/api/*` must be excluded from public access where they handle admin operations. These rules are governed by DOC-070.

---

## 7. Testimonials Model

Testimonials belong to projects. They are not standalone entities. Every testimonial is associated with exactly one project.

Each testimonial has a boolean flag — `featuredOnPortfolio` — that controls whether it appears on the `/portfolio` listing page beneath the Hero section. The operator controls which testimonials are featured. There is no automatic selection logic.

Projects are not hard-deleted until explicitly confirmed through a two-step process. Archiving a project deactivates it and its testimonials without destroying them. Hard deletion is a separate, additional action. See DOC-020 §3.4 and DOC-030 §5.5 for full behavior.

---

## 8. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14+ (App Router) | SSR, routing, API routes |
| Language | TypeScript (Strict Mode) | Zero-error type safety |
| CMS / Database | Sanity CMS | All data storage (content only) |
| Auth | NextAuth + Google OAuth | Authentication with email whitelist |
| Validation | Zod | Request/schema validation |
| Styling | Tailwind CSS | Utility-first CSS |
| Hosting | Netlify | CDN, serverless functions |
| Analytics | Google Analytics | Traffic analytics (ID via CMS) |

### 8.1 Single Production Deployment Per Client

Each client receives exactly one production deployment. There is no staging environment serving as a de facto production site.

### 8.2 Source of Truth

The canonical codebase is the source of truth for system behavior. The Content Store (Sanity) is the source of truth for all content. The deployment environment is the source of truth for configuration secrets. No source of truth may contradict another.

---

## 9. Quality Bar

### 9.1 Production-Grade Definition

A feature is production-grade when:

1. **It works reliably.** The feature performs its stated function without failure under normal use conditions.
2. **It works completely.** All user-facing paths produce correct results. Partial implementations are not acceptable.
3. **It persists correctly.** Data entered is saved, retrieved, and displayed correctly. No data loss, corruption, or silent failure.
4. **It communicates clearly.** Success states, error states, and required actions are communicated unambiguously.
5. **It fails safely.** Errors are handled gracefully. The system does not enter undefined states or lose data.
6. **It is secure by default.** Every route enforces authentication where required. Input is validated. Output is sanitized. Security requirements per DOC-060 are satisfied.
7. **It is indexable correctly.** Every public page satisfies the SEO requirements of DOC-070.
8. **It works on mobile.** Every public page and every Back Office function satisfies the mobile requirements of DOC-050.

### 9.2 Disqualifying Conditions

- Save operations that do not actually save
- Configuration that does not apply
- UI controls that do not affect system behavior
- Error states that appear as success
- Data entry that is silently discarded
- Status values that disagree between display and storage
- Validation that accepts invalid input or rejects valid input
- Hard-coded text on any public-facing surface
- Admin routes accessible without authentication
- Public pages missing required SEO metadata

### 9.3 Lighthouse Scores

All four Lighthouse categories must score **95 or above** in production:

- Performance ≥ 95
- Accessibility ≥ 95
- Best Practices ≥ 95
- SEO ≥ 95

Scores below 95 in any category constitute a defect.

### 9.4 Full Responsiveness

The site must be fully responsive across all viewport sizes. Mobile-first design. The mobile experience is a first-class product, not a condensed desktop adaptation. Breakpoint requirements are governed in DOC-050.

### 9.5 SEO Completeness

Governed in full by DOC-070. Summary: every public page includes meta tags, structured data (JSON-LD), Open Graph tags, canonical URLs, sitemap inclusion, and robots compliance. All SEO metadata is editable through the Back Office.

### 9.6 Security Completeness

Governed in full by DOC-060. Summary: all authentication, CSRF protection, security headers, input validation, output sanitization, rate limiting, and upload security requirements must be satisfied before any route is considered production-ready.

### 9.7 Zero TypeScript Suppressions

No `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, or `as any` anywhere in the codebase.

### 9.8 Honest State Communication

When the system transitions between states — saving, loading, error, success, empty — that transition is visible to the operator. The operator is never left uncertain whether an action took effect.

---

## 10. Explicit Non-Goals

- **CRM / Lead tracking** — Contact form submissions are not stored.
- **Pricing pages** — No pricing information presented or managed.
- **Marketing automation** — No email campaigns or automated communications.
- **Payment processing** — No invoicing or financial transactions.
- **Multi-language / RTL** — English only.
- **Multi-user role hierarchy** — Single operator or small team with equivalent access.
- **Third-party CRM integration** — No sync with external platforms.
- **Enterprise scale** — Designed for small to mid-size project management firms.

---

## 11. Document Hierarchy

All subsequent canonical documents are subordinate to this charter. They extend and operationalize the commitments made here. They do not contradict, dilute, or reinterpret them.

| Document | Scope |
|----------|-------|
| DOC-010 | Architecture & Responsibility Boundaries |
| DOC-020 | Canonical Data Model |
| DOC-030 | Back Office & Operational Model |
| DOC-040 | API Contract & Mutation Semantics |
| DOC-050 | Back Office UX Interaction Contract |
| DOC-060 | Security & Operational Hardening |
| DOC-070 | SEO, Indexability & Metadata Governance |

---

## 12. Binding Nature

### 12.1 Violations Are Defects

Any behavior that contradicts this charter is a defect. If it violates the charter, it is wrong and must be corrected.

### 12.2 Convenience Does Not Override Governance

Hard-coding content, skipping authentication, accepting partial saves, suppressing errors — none of these are acceptable trade-offs.

### 12.3 Change Control

Revisions require clear documentation of what changed and why, an updated version number and timestamp, and explicit acknowledgment of any superseded commitments. This charter does not change through omission, assumption, or accumulated deviation.

---

## 13. Summary

AMG exists to give project management companies a professional digital presence that works — reliably, completely, honestly, securely, and with full operator control over every word the public can read. Every piece of content is managed through the CMS. Every admin function works as advertised. Every failure is communicated. Every deployment is independent. Every public page is correctly indexed. Every surface is mobile-ready.

This is not aspiration. This is specification. Everything built serves this purpose. Nothing built contradicts it.

---

*End of document.*
