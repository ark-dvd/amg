# DOC-030 — AMG Back Office & Operational Model

**Status:** Canonical
**Effective Date:** March 9, 2026
**Version:** 1.1
**Timestamp:** 20260309-1555 (CST)
**Governing Documents:** DOC-000 — AMG System Charter (v1.1); DOC-010 — Architecture (v1.1); DOC-020 — Data Model (v1.1)

---

### Revision History

| Version | Timestamp (CST) | Changes |
|---------|-----------------|---------|
| 1.0 | 20260309-1532 | Initial release |
| 1.1 | 20260309-1555 | §3 Back Office Structure replaced — entity-first sidebar replaced with page-first sidebar organized by public site pages; §5.5 Delete Flow updated to reflect archive/restore/permanent-delete lifecycle (DOC-020 §8); §12 Admin Site Resemblance Principle added; §13 Site Settings Tab expanded to reflect UIText sections; error message language contract clarified throughout |

---

### Document Standards

Canonical documents are written in English. All timestamps use Central Standard Time (CST).

---

## 1. Executive Intent

The Back Office is the operational nerve center of AMG. It is not a decoration. It is the actual instrument by which the operator controls the public-facing website.

Every control that exists must function. Every save must persist. Every delete must delete. Every publish must publish. Every error must be surfaced.

Beyond functional correctness, the Back Office must feel familiar to a non-technical operator. Its structure must mirror the structure of the public site. An operator opening the "Homepage" tab should see the sections of the homepage in the order they appear on the live site. An operator editing "Portfolio" should see the portfolio layout. This principle — admin resembles the public site — is a governing constraint, not a design suggestion.

---

## 2. Access and Authentication

### 2.1 Login

The Back Office login page is at `/admin/login`. It presents a single "Sign in with Google" button. No username/password authentication is provided.

After successful Google OAuth, the session is verified against the email whitelist. Accounts not on the whitelist are rejected.

On successful authentication, the operator is redirected to `/admin` (defaults to Homepage tab).

### 2.2 Session

Sessions expire after 24 hours. On expiry, the operator is redirected to `/admin/login`. All unsaved form state is preserved in local storage if possible, and a "You were redirected to login. Your unsaved changes may still be available." message is shown after re-authentication.

### 2.3 Unauthorized Access

Any attempt to access a Back Office route without a valid session results in immediate redirect to `/admin/login`. No exceptions.

---

## 3. Back Office Structure — Page-First Organization

The Back Office sidebar is organized by **public site page**, not by entity type. This mirrors the public site's navigation and allows a non-technical operator to locate content by asking "which page am I trying to edit?" rather than "which content type do I need?"

### 3.1 Sidebar Structure

```
┌─────────────────────┐
│  AMG Back Office    │
├─────────────────────┤
│  PAGES              │
│  ├─ Homepage        │
│  ├─ About           │
│  ├─ Services        │
│  ├─ Portfolio       │
│  ├─ Insights        │
│  └─ Contact         │
├─────────────────────┤
│  GLOBAL             │
│  ├─ Site Settings   │
│  └─ Navigation      │
└─────────────────────┘
```

Each top-level item corresponds to a public-facing page or global configuration area. The sidebar is always visible on desktop. It collapses on mobile (see §11).

### 3.2 Homepage Tab

The Homepage tab is organized as sections in the exact order they appear on the public homepage:

1. **Hero** — full-screen hero media, headline, subheadline, CTA label, CTA URL, overlay opacity
2. **About Preview** — controls which About content snippets are surfaced on the homepage (links to full About editing)
3. **Services Section** — section heading and subheading (fields from `home.servicesHeading/Subheading`); a note that services content is managed in the Services tab
4. **Portfolio Section** — section heading and subheading; list of projects with `featuredOnHomepage` toggle visible here for quick control
5. **Testimonials Section** — section heading; featured testimonials per project (quick-toggle `featuredOnPortfolio`)
6. **Insights Section** — section heading; note that article content is managed in Insights tab
7. **CTA Section** — section heading, subheading, button label (`home.ctaHeading`, `home.ctaSubheading`, `home.ctaButtonLabel`)

Each section in the Homepage tab is visually separated and labeled to match the public site section names. The operator can understand the layout without documentation.

### 3.3 About Tab

Full About singleton editing:

- Page title, intro paragraph
- Body rich text (Portable Text editor)
- Cover image
- Team section title
- Team members list (with drag-to-reorder)

Field groups are presented in the order they render on the public About page.

### 3.4 Services Tab

Two sub-views:

- **Services List** — list of all services with status, order, edit, archive/delete controls
- **Edit Service** (slide-over) — all service fields in render order: title, slug, short description, body, icon, cover image, status, display order, SEO fields

### 3.5 Portfolio Tab

Three sub-views:

- **Projects** — list of all active (non-archived) projects
- **Archived Projects** — list of archived projects with restore and permanent-delete controls
- **Edit Project** (slide-over) — all project fields in render order, plus associated testimonials section at the bottom

The Portfolio tab also governs the `/portfolio` page hero content. The top of the Portfolio tab (above the project list) shows editable fields for:
- Portfolio page heading (`portfolio.pageHeading`)
- Portfolio page subheading (`portfolio.pageSubheading`)
- Testimonials section heading on Portfolio page (`portfolio.testimonialsHeading`)

This keeps all Portfolio page content visible in one place.

### 3.6 Insights Tab

Two sub-views:

- **Articles** — list of all articles with status (Draft/Published), created date, edit, publish/unpublish, delete controls
- **Edit Article** (slide-over) — all article fields in render order

The top of the Insights tab shows editable fields for:
- Insights page heading (`insights.pageHeading`)
- Insights page subheading (`insights.pageSubheading`)

### 3.7 Contact Tab

The Contact tab manages the content of the `/contact` public page:

- Contact page heading and subheading
- Contact form labels (name, email, phone, company, message, submit button)
- Contact form success/error messages
- Direct contact details (email, phone, address — sourced from SiteSettings contact section)

This tab makes the full contact page editable in one place. The operator does not need to navigate to Site Settings to update the form submit button label.

### 3.8 Site Settings Tab

Organized into collapsible sections:

- **Identity** — site name, tagline, logo, favicon
- **SEO** — global SEO title, description, OG image
- **Analytics** — Google Analytics ID
- **Social Links** — LinkedIn, Twitter/X, Facebook, Instagram, YouTube
- **Footer** — footer text, policy page link labels
- **Policy Pages** — Terms, Privacy, Accessibility rich text editors
- **Empty States** — configurable empty state messages
- **Error Pages** — 404 heading, message, CTA label

### 3.9 Navigation Tab (Global)

The Navigation tab manages:

- Navigation labels for all nav items (About, Services, Portfolio, Insights, Contact)
- Nav CTA button label

This provides a dedicated place for the operator to rename any navigation item without hunting through Site Settings.

---

## 4. Singleton Edit Behavior (Hero, About, Contact, SiteSettings)

### 4.1 Load Behavior

On tab open, the Back Office calls the admin API GET endpoint for the singleton.

**Initialized:** Form is populated with persisted values.

**Uninitialized:** An explicit initialization prompt is shown. No empty form is rendered. No defaults are fabricated.

### 4.2 Edit and Save Behavior

Fields are directly editable inline. Changes are held in component state until the operator explicitly saves.

**Unsaved changes guard:** Navigating away while changes are unsaved triggers a confirmation dialog.

**Save flow:**
1. Save button → "Saving…" (disabled)
2. On success: form updates with verified canonical snapshot, success notification shown, "Last saved" timestamp updates
3. On failure: form state preserved, error message shown, operator can retry

### 4.3 Conflict State

When API returns `CONFLICT`:

> ⚠️ This content was modified in another session. Your changes have not been saved. Reload to see the latest version.

A "Reload Content" button fetches the current state. Unsaved input is discarded — this is explicitly communicated.

---

## 5. Collection Behavior (Services, Projects, Articles)

### 5.1 List View

Each list row shows: title, status badge, display order (with drag handle for ordered entities), last updated, action buttons.

### 5.2 Create

"New [Entity]" button opens a slide-over panel. Required fields are clearly marked. On submit: success → item appears in list; failure → panel remains open, input preserved, error shown.

### 5.3 Edit

"Edit" opens slide-over pre-populated with current values. Save behavior identical to §4.2.

### 5.4 Status Toggle

`isActive` (Service, Project) is togglable from the list view with a toggle switch. The toggle calls the status API immediately. On failure, it reverts and shows an error.

### 5.5 Delete / Archive Flow

**Services and Articles — Single-Step Hard Delete:**

Confirmation dialog:

> **Delete "[Title]"?**
> This action cannot be undone.
> [Cancel] [Delete]

On confirm: item removed from list.

**Projects — Two-Step Lifecycle:**

**Step 1: Archive (available from active project list)**

> **Archive "[Project Title]"?**
> This will hide the project and its **N testimonial(s)** from the public site.
> You can restore this project from the Archived Projects view.
> [Cancel] [Archive]

On confirm: project and testimonials move to archived state. Project disappears from main list. Appears in "Archived Projects" sub-view.

**Step 2: Permanent Delete (available only from Archived Projects view)**

> **Permanently delete "[Project Title]"?**
> This will permanently destroy the project and its **N testimonial(s)**.
> **This cannot be undone.**
> Type the project name to confirm: [________]
> [Cancel] [Permanently Delete]

The operator must type the project title exactly to enable the permanent delete button. On confirm: project and testimonials are destroyed.

**Step 2 alternative: Restore**

> **Restore "[Project Title]"?**
> The project and its testimonials will be restored to inactive state. You can re-activate them from the project editor.
> [Cancel] [Restore]

---

## 6. Portfolio Tab — Testimonial Management

### 6.1 Testimonials Within Project Edit

The project edit slide-over contains a "Testimonials" section at the bottom. It shows:
- All testimonials associated with the project
- Per testimonial: author name, quote excerpt, `featuredOnPortfolio` toggle, edit button, delete button
- "Add Testimonial" button

The `featuredOnPortfolio` toggle calls the toggle endpoint immediately. On failure, it reverts.

### 6.2 Homepage Testimonial Override

The Homepage tab provides a quick view of all `featuredOnPortfolio: true` testimonials, grouped by project, with the ability to toggle them directly. This allows the operator to manage homepage testimonial display without navigating into project edit.

---

## 7. Insights Tab — Article Lifecycle

### 7.1 Article Status

Draft → gray badge. Published → green badge.

### 7.2 Publish

No confirmation required. Button → "Publishing…" → status updates. A notice is shown in the edit panel for published articles:

> 🟢 This article is **published** and visible on the public site. Changes you save will appear immediately.

### 7.3 Unpublish

Requires brief confirmation dialog (one step, no title typing required).

---

## 8. Navigation Tab

The Navigation tab is a simple form with labeled fields for each nav item label and the CTA button label. Single Save button. Follows singleton save behavior (§4.2).

---

## 9. Media Upload

### 9.1 Image Upload

Images upload to Sanity's asset pipeline via `/api/admin/upload`. Supported: JPEG, PNG, WebP, GIF. Max: 10 MB.

Image fields display upload zone when empty; thumbnail with "Replace" and "Remove" when populated.

### 9.2 Video

Hero video is an external URL. A "Preview" button opens a modal player for verification before save.

---

## 10. Error Handling

### 10.1 Error Message Language

All error messages displayed to the operator are human-readable English sentences. Raw API error messages, error codes, status codes, and technical strings are never rendered in the UI.

The Back Office maps all API error codes to operator-facing messages. The mapping is maintained in a dedicated translation file in the codebase.

### 10.2 Error Display Categories

| Situation | Display |
|-----------|---------|
| Field validation error | Inline, adjacent to invalid field |
| Conflict | Yellow banner with reload prompt |
| Auth expired | Redirect to login |
| Server/network error | Red top banner with retry |
| Write acknowledged but read-back failed | Orange banner: "Your changes may have been saved. Please reload to verify before retrying." |

### 10.3 Loading States

Every async operation shows an explicit loading indicator. The operator is never uncertain whether an operation is in progress.

### 10.4 Success Confirmation

Every successful mutation produces a visible success notification (top-right, green, auto-dismisses after 4 seconds).

---

## 11. Mobile Back Office

The Back Office is designed desktop-first but must be fully functional on mobile.

On mobile:
- Sidebar collapses behind hamburger icon
- Edit panels open as full-screen overlays
- Drag-to-reorder is replaced with up/down arrow buttons
- All save/publish/delete actions are accessible without horizontal scrolling
- Touch targets minimum 44×44px for all interactive elements

---

## 12. Admin Site Resemblance Principle

The Back Office structure deliberately mirrors the public site. This is a governing principle, not a styling preference.

**Binding rules:**

1. The sidebar is organized by public page name, not by entity type. An operator looking for "what appears on the Portfolio page" must find it in the Portfolio tab.

2. Within each page tab, sections are presented in the same vertical order they appear on the public page. Editing the Hero section of the Homepage must be at the top of the Homepage tab.

3. Section labels in the admin use the same terminology as the public site. If the public page calls a section "Our Work," the admin calls it "Our Work" — not "Portfolio Items."

4. When an operator makes a change and saves, what they see in the form represents what is live on the public site. There is no divergence between "form state" and "live site state" after a successful save.

5. Unrelated entity management (e.g., creating a new Service) is accessible from the relevant page tab (Services tab) and does not require navigating to a separate "Content Types" section.

---

## 13. Operational Constraints

- No public preview of changes before save
- No version history or rollback
- No bulk import/export
- No analytics or reporting dashboards within the Back Office
- No inline rich text image uploads (images are uploaded via the dedicated image field controls, not pasted into the editor)

---

*End of document.*
