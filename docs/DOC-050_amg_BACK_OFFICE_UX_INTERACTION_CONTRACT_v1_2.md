# DOC-050 — AMG Back Office UX Interaction Contract

**Status:** Canonical
**Effective Date:** March 10, 2026
**Version:** 1.2
**Timestamp:** 20260310-1017 (CST)
**Governing Documents:** DOC-000 (v1.1); DOC-030 (v1.1); DOC-040 (v1.1)

---

### Revision History

| Version | Timestamp (CST) | Changes |
|---------|-----------------|---------|
| 1.0 | 20260309-1532 | Initial release |
| 1.1 | 20260309-1555 | Page-first sidebar; Homepage tab section interaction; two-step archive/delete; expanded mobile UX; field grouping principle; preview behavior |
| 1.2 | 20260310-1017 | §5.6 Drag-and-Drop Reorder fully replaced with §5.6 Reorder Governance — defines desktop drag behavior, mobile fallback controls (up/down arrows), touch target requirements, failure recovery, and optimistic/rollback semantics |

---

### Document Standards

Canonical documents are written in English. All timestamps use Central Standard Time (CST).

---

## 1. Executive Intent

This document defines the precise interaction contract between the AMG Back Office user interface and the operator. Every state transition, feedback signal, form behavior, and decision point is governed.

The operator must always know exactly what the system did, what state it is in, and what action is available next. Ambiguity is a defect.

---

## 2. Layout and Navigation

### 2.1 Shell Structure

```
┌────────────────────────────────────────┐
│  Header (logo, user email, sign out)   │
├───────────────┬────────────────────────┤
│               │                        │
│  Sidebar      │   Main Content Area    │
│  (page-first) │                        │
│               │                        │
└───────────────┴────────────────────────┘
```

Sidebar and header are always visible (desktop). Main content area scrolls independently.

### 2.2 Sidebar Structure and Behavior

The sidebar is organized by public site page:

```
PAGES
  Homepage
  About
  Services
  Portfolio
  Insights
  Contact

GLOBAL
  Site Settings
  Navigation
```

Active item is visually highlighted (distinct background, bold label). Clicking a tab updates the URL `?tab=<n>` without full page reload. Tab state survives browser navigation.

On mobile, the sidebar hides behind a hamburger icon. Tapping opens a full-height drawer overlay.

### 2.3 Header

Displays: AMG Back Office logo (left), logged-in user email (right), Sign Out button (right). Sign Out terminates session and redirects to `/admin/login`.

---

## 3. Loading States

### 3.1 Tab Content Load

On tab open: skeleton loading state mirroring the expected layout. 10-second timeout before error state.

### 3.2 Save Button Loading

"Saving…" label + spinner, button disabled. No other form interaction blocked during save.

### 3.3 List Loading

Skeleton rows during list fetch. "New [Entity]" button remains enabled during load.

---

## 4. Homepage Tab — Section-by-Section Interaction

The Homepage tab presents editing sections in the same vertical order as the public homepage. Each section is collapsible but expanded by default.

### 4.1 Section Order

1. **Hero** — media type, image/video field, headline, subheadline, CTA label, CTA URL, overlay opacity
2. **About Preview** — read-only summary with "Edit About Page" link
3. **Services Section** — `home.servicesHeading`, `home.servicesSubheading`
4. **Portfolio Section** — `home.portfolioHeading`, `home.portfolioSubheading` + `featuredOnHomepage` toggles
5. **Testimonials Section** — `home.testimonialsHeading` + featured testimonial toggles
6. **Insights Section** — `home.insightsHeading`
7. **CTA Section** — `home.ctaHeading`, `home.ctaSubheading`, `home.ctaButtonLabel`

### 4.2 Save Behavior

Each collapsible section saves independently. A dedicated "Save" button at the bottom of each section submits only that section's fields.

---

## 5. Collection List Behavior

### 5.1 List Item Structure

| Column | Content |
|--------|---------|
| Title | Entity title (truncated if long) |
| Status | Active/Inactive or Draft/Published badge |
| Order | Drag handle + numeric value (ordered entities, desktop only) |
| Updated | Relative timestamp |
| Actions | Edit / Delete (Service, Article) or Edit / Archive (Project) |

### 5.2 Empty State

```
No [entities] yet.
[New Entity]
```

### 5.3 Create

"New [Entity]" opens a right-side slide-over panel. Required fields marked with *. On submit: success → panel closes, item in list; failure → panel stays open, input preserved, error shown.

### 5.4 Edit

"Edit" opens slide-over pre-populated with current values. Fields in render order (§11). Save success: form updates with verified snapshot. Save failure: input preserved, error shown.

### 5.5 Delete and Archive Flow

**Services and Articles — Hard Delete:**

> **Delete "[Title]"?**
> This action cannot be undone.
> [Cancel] [Delete]

**Projects — Step 1: Archive:**

> **Archive "[Project Title]"?**
> The project and its **N testimonial(s)** will be hidden from the public site.
> You can restore from the Archived Projects view.
> [Cancel] [Archive]

**Projects — Step 2: Permanent Delete (Archived Projects view only):**

> **Permanently delete "[Project Title]"?**
> This will permanently destroy the project and its **N testimonial(s)**.
> **This cannot be undone.**
>
> Type the project name to confirm: [________________________]
>
> [Cancel] [Permanently Delete — disabled until name matches exactly]

**Projects — Restore:**

> **Restore "[Project Title]"?**
> The project and its testimonials will be restored to inactive state.
> [Cancel] [Restore]

Success notification: "Project restored. It is currently inactive — activate it from the project editor to make it public."

### 5.6 Reorder Governance

Reordering applies to Services (ordered by `order` ascending on the public site) and active Projects (ordered by `order` ascending on the portfolio page).

#### 5.6.1 Desktop Drag-and-Drop (≥ 768px)

On desktop and tablet viewports, reordering is performed via drag-and-drop:

- Each list row has a drag handle icon (⣿) on the left edge
- The drag handle is the only draggable target — clicking the row itself does not initiate drag
- While dragging, the dragged row is visually elevated (shadow, slight opacity reduction)
- A drop indicator line shows the target position
- Dropping completes the reorder

**Optimistic update:** The list reorders immediately in the UI upon drop, before the API call completes. The new order is submitted to `PATCH /api/admin/[entity]/reorder`.

**On API success:** The UI retains the new order. A brief success indicator (checkmark, 1.5 seconds) appears adjacent to the drag handle area.

**On API failure:** The list reverts to the pre-drag order. An error notification is shown: "Reorder failed. The previous order has been restored." The operator may retry.

**Drag handle touch target (desktop):** Minimum 32×44px hit area. On hover, the cursor changes to `grab`. While dragging, cursor is `grabbing`.

#### 5.6.2 Mobile Fallback — Up/Down Arrow Controls (< 768px)

Drag-and-drop is disabled on mobile (< 768px). In its place, each list row displays **up (↑) and down (↓) arrow buttons** for sequential reordering.

**Arrow button behavior:**
- **↑ (Move Up):** Swaps the item with the item immediately above it in the list. Disabled (grayed) for the first item in the list.
- **↓ (Move Down):** Swaps the item with the item immediately below it in the list. Disabled (grayed) for the last item in the list.

**Persistence model:** Each arrow tap immediately calls `PATCH /api/admin/[entity]/reorder` with the updated order array for the two affected items. The API endpoint is the same as desktop reorder — it accepts a full array of `{ id, order }` objects.

**On API success:** The list reflects the new order. No separate notification (the visual change is the confirmation).

**On API failure:** The list reverts to the pre-tap order. Inline error message below the affected row: "Could not update order. Please try again." Auto-dismisses after 4 seconds.

**Touch target requirements:** Arrow buttons must be a minimum of **44×44px** hit area regardless of visual size. Padding expands the hit area where needed. The two buttons (↑ and ↓) are adjacent but visually separated with a minimum 8px gap to prevent mis-taps.

**Visual placement:** Arrow buttons appear on the right side of each list row on mobile, replacing the drag handle. Action buttons (Edit, Archive) collapse into a "⋮" menu on mobile (per §10.5), leaving sufficient space for the arrow buttons.

#### 5.6.3 Reorder Invariants

- The order of items not involved in a reorder operation does not change
- Reorder operations are all-or-nothing: if the API call fails, no order values change in the data store
- The `order` field of each entity reflects its current display position (0-indexed or 1-indexed consistently per entity type — the API contract for reorder (DOC-040 §4.3) defines the accepted format)
- An item cannot be moved above position 0 or below the last position
- Reorder is independent of active/inactive status — inactive items retain their order relative to other items

---

## 6. Singleton Form Behavior (Hero, About, Contact, SiteSettings)

### 6.1 Initialized State

Form populated with persisted values. "Last saved" timestamp displayed.

### 6.2 Uninitialized State

No empty form rendered. Explicit prompt:
```
This section has not been set up yet.
[Initialize Section]
```

### 6.3 Unsaved Changes Guard

Navigating away with unsaved changes:
> **Unsaved changes**
> You have unsaved changes. Leaving now will discard them.
> [Leave] [Stay and Save]

### 6.4 Save Flow

1. Operator clicks "Save"
2. Button → "Saving…" (disabled, spinner)
3. On success: form updates with verified snapshot, "Last saved" updates, success notification
4. On failure: input preserved, error shown

### 6.5 Conflict State

Yellow banner:
> ⚠️ This content was modified in another session. Your changes have not been saved. Reload to see the latest version.
> [Reload Content]

### 6.6 False-Negative State

Orange banner (when API returns `mayHavePersisted: true`):
> ⚠️ We couldn't confirm your changes were saved. They may have been applied. Please reload to verify before retrying.
> [Reload Content]

---

## 7. Portfolio Tab — Testimonial Interactions

### 7.1 Testimonials in Project Edit

Project edit slide-over: "Testimonials" section at bottom with per-testimonial controls. `featuredOnPortfolio` toggle calls API immediately; reverts on failure.

### 7.2 Featured Testimonials on Homepage Tab

Homepage tab shows `featuredOnPortfolio: true` testimonials with direct toggle access.

---

## 8. Insights Tab — Article Lifecycle

### 8.1 Publish

No confirmation required. For published articles, notice in edit panel:
> 🟢 This article is **published** and visible on the public site. Changes you save will appear immediately.

### 8.2 Unpublish

Single confirmation dialog (no title typing required):
> **Unpublish "[Title]"?**
> The article will no longer be visible on the public site.
> [Cancel] [Unpublish]

---

## 9. Notifications

### 9.1 Success

Top-right green banner. Auto-dismisses after 4 seconds. Manually dismissable.

### 9.2 Error

Top-right red banner. Does not auto-dismiss. Includes "Retry" where applicable.

### 9.3 Warning (Conflict / False Negative)

Yellow or orange inline banner within the affected form section.

### 9.4 Stack

Maximum 3 simultaneous notifications. Stacked vertically. Each independently dismissable.

---

## 10. Mobile UX

Mobile is a first-class execution surface. All rules are binding.

### 10.1 Breakpoint Table

| Breakpoint | Range | Behavior |
|------------|-------|----------|
| Desktop | ≥ 1024px | Full sidebar; slide-over panels from right |
| Tablet | 768px–1023px | Icon-only sidebar; full-width modals |
| Mobile | < 768px | Hidden sidebar (hamburger); full-screen overlays |

### 10.2 Touch Targets

All interactive elements must have minimum **44×44px** touch targets. This includes: list action buttons, toggles, tabs, arrow reorder buttons, submit/save/cancel buttons, notification dismiss buttons, drag handles (desktop only).

### 10.3 Reorder on Mobile

Drag-and-drop replaced by up/down arrow buttons. Full specification in §5.6.2.

### 10.4 Form Usability on Mobile

- Form fields: `font-size: 16px` minimum (prevents iOS auto-zoom)
- `type="email"`, `type="url"` fields use appropriate mobile keyboards
- Multi-line text areas: minimum `rows="4"`, vertically resizable
- Save button: sticky at bottom of slide-over on mobile — always visible without scrolling

### 10.5 List Collapse on Mobile

On mobile (< 768px):
- "Updated" and "Order" columns hidden
- Action buttons collapse to a "⋮" (three-dot) menu per row
- "⋮" menu opens an action sheet with all available actions (Edit, Archive/Delete, etc.)

On tablet (768px–1023px):
- "Updated" column may be hidden
- Action buttons inline if space permits; otherwise three-dot menu

### 10.6 Modal and Panel Behavior

- Desktop: slide-over at ~50% viewport width from right
- Tablet: full-width modal
- Mobile: full-screen overlay

All overlays include X close button and respect unsaved changes guard (§6.3).

### 10.7 No Hidden Actions on Mobile

Every action available on desktop must be accessible on mobile. Nothing critical may be behind hover states.

---

## 11. Field Grouping Principle

Fields within edit panels are presented in the same vertical order they render on the public page.

**Binding rule:** First field in form = first visible element on public page. Last field = last visible element. SEO fields always at bottom regardless of public position.

**Application:**
- Project: Title → Client Name → Cover Image → Short Description → Project Type → Technologies → Body → Completed At → Screenshots → Status/Order → [Testimonials section] → SEO
- Service: Title → Cover Image → Short Description → Body → Icon → Status/Order → SEO
- Article: Title → Cover Image → Excerpt → Body → Category → Tags → Author → Status → SEO
- Homepage tab: Hero → About Preview → Services → Portfolio → Testimonials → Insights → CTA

---

## 12. Preview Behavior

### 12.1 Video Preview

Hero video URL field: "Preview" button opens modal player. Operator verifies before saving.

### 12.2 "View on Site" Link

After successful save, "View on site →" link appears in success notification. Opens relevant public URL in new tab. (Only for published entities — draft articles do not get this link.)

### 12.3 OG Image Preview

Site Settings OG Image field: simulated social card preview using the image alongside `globalSeoTitle` and `globalSeoDescription`.

---

## 13. Form Field Standards

### 13.1 Required Fields

Red asterisk (*). Validation on submit only.

### 13.2 Character Limits

Live counter below field. Turns red at 90% of limit.

### 13.3 Slug Fields

URL preview shown below input. Auto-populated from Title. Read-only after first save with unlock button that displays:
> ⚠️ Changing a slug will break existing links. You are responsible for setting up redirects.

### 13.4 Portable Text Editor

Minimal WYSIWYG: H2, H3, bold, italic, unordered list, ordered list, blockquote, external links. No tables, no embedded media.

### 13.5 Boolean Toggles

Toggle switches with visible On/Off labels. State always visible at a glance.

---

## 14. Accessibility

- All interactive elements keyboard-accessible with visible focus indicators
- All form fields have associated `<label>` elements
- Error messages announced via ARIA live regions
- Color never the sole state indicator
- Minimum contrast 4.5:1 for all text
- Skip navigation link at top of admin shell

---

*End of document.*
