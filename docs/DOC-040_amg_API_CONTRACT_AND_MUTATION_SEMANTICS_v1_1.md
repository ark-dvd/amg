# DOC-040 — AMG API Contract & Mutation Semantics

**Status:** Canonical
**Effective Date:** March 9, 2026
**Version:** 1.1
**Timestamp:** 20260309-1555 (CST)
**Governing Documents:** DOC-000 (v1.1); DOC-010 (v1.1); DOC-020 (v1.1)

---

### Revision History

| Version | Timestamp (CST) | Changes |
|---------|-----------------|---------|
| 1.0 | 20260309-1532 | Initial release |
| 1.1 | 20260309-1555 | §2.3 Mutation Lifecycle updated — CSRF_CHECK step added, eventual consistency handling added, false-negative response added; §2.5 Timestamps: `_rev` included in all entity responses; §3.1 success envelope now includes `_rev`; §3.5 error codes updated — added `CSRF_INVALID`, `WRITE_TIMEOUT`, `ARCHIVE_REQUIRED`; §4.4 Projects — added archive/restore/permanent-delete endpoints; §4.5 Testimonials updated for archive state; §5 HTTP method summary updated; §6 observability section expanded |

---

### Document Standards

Canonical documents are written in English. All timestamps use Central Standard Time (CST).

---

## 1. Executive Intent

The API contract defines the boundary between the Back Office and the Content Store. It is the enforcement point for authentication, CSRF protection, validation, mutation determinism, and honest state communication.

Every rule in this document exists because its absence was demonstrated to produce defects. This contract is binding. Deviations are non-compliant regardless of whether they appear to function.

---

## 2. General Rules

### 2.1 Authentication

Every route under `/api/admin/*` calls `requireAdmin()` as the first operation. Failure returns `401 Unauthorized` immediately.

### 2.2 Input Validation

Every mutation validates the request body against a Zod schema before any database operation. Failures return `400 Bad Request` with field-level error details.

### 2.3 Mutation Lifecycle

Every mutation (POST, PUT, PATCH, DELETE) traverses:

```
INIT → CSRF_CHECK → WRITE_ATTEMPT → READ_BACK_VERIFY → SUCCESS | FAILURE
```

**INIT:** Generate `requestId` (UUID v4), record start timestamp.

**CSRF_CHECK:** Validate CSRF token (per DOC-010 §5.5). Failure → `403 CSRF_INVALID`. No further processing.

**WRITE_ATTEMPT:** Execute Sanity write using atomic transaction. On timeout → `WRITE_TIMEOUT`. On error → `WRITE_FAILED`.

**READ_BACK_VERIFY:** Perform canonical read using `useCdn: false`. Verify `_id`, `_rev` changed from pre-write value, and required fields present. On first attempt null/unexpected: wait 200ms and retry once. Timeout ceiling: 2 seconds total.

**On verified success → SUCCESS.**

**On failed read-back after retry → FAILURE with code `READBACK_FAILED`.**

**False-negative case:** When the write was acknowledged by Sanity but read-back failed, the response is FAILURE, but the error message is specifically: `"Your changes may have been saved. Please reload before retrying."` This is distinguishable from a clean write failure (`WRITE_FAILED`) where the write was not acknowledged.

### 2.4 Request IDs

Every response includes `requestId` (UUID v4).

### 2.5 Timestamps and Revision

All entity responses include `_rev` (Sanity's revision identifier). `_rev` is the primary optimistic concurrency token per DOC-020 §6.1.

`createdAt` and `updatedAt` are set by the API. Client-supplied values for these fields are ignored.

---

## 3. Response Envelopes

### 3.1 Success Envelope (Single Entity)

```json
{
  "success": true,
  "requestId": "uuid-v4",
  "data": {
    "_id": "...",
    "_rev": "...",
    "updatedAt": "ISO-8601",
    /* entity fields */
  }
}
```

`data` MUST be non-null and non-empty with verified entity content. `success: true` with `data: null` is a contract violation.

### 3.2 Success Envelope (List)

```json
{
  "success": true,
  "requestId": "uuid-v4",
  "data": [ /* array of entities, each including _rev */ ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### 3.3 Error Envelope

```json
{
  "success": false,
  "requestId": "uuid-v4",
  "error": {
    "category": "VALIDATION | AUTH | CSRF | NOT_FOUND | CONFLICT | PERSISTENCE | SERVER",
    "code": "STABLE_ERROR_CODE",
    "message": "Human-readable English description",
    "fieldErrors": { "fieldName": "error message" },
    "retryable": true,
    "mayHavePersisted": false
  }
}
```

`fieldErrors` present only for `VALIDATION` errors.

`mayHavePersisted: true` is set when `code === "READBACK_FAILED"` — indicating the write may have succeeded despite the failure response.

### 3.4 Uninitialized Singleton Response

```json
{
  "success": true,
  "requestId": "uuid-v4",
  "data": null,
  "initialized": false
}
```

Only permitted success response with `data: null`.

### 3.5 Error Codes

| Code | Category | HTTP | Description |
|------|----------|------|-------------|
| `UNAUTHORIZED` | AUTH | 401 | No valid session or email not whitelisted |
| `FORBIDDEN` | AUTH | 403 | Session valid, access denied |
| `CSRF_INVALID` | CSRF | 403 | CSRF token missing or invalid |
| `NOT_FOUND` | NOT_FOUND | 404 | Entity does not exist |
| `NOT_INITIALIZED` | NOT_FOUND | 404 | Singleton not initialized |
| `CONFLICT` | CONFLICT | 409 | `_rev` mismatch — concurrent modification |
| `ARCHIVE_REQUIRED` | CONFLICT | 409 | Project must be archived before permanent delete |
| `VALIDATION_FAILED` | VALIDATION | 400 | Input validation failure |
| `SLUG_CONFLICT` | VALIDATION | 400 | Slug already exists in entity type |
| `WRITE_FAILED` | PERSISTENCE | 500 | Sanity write operation failed |
| `WRITE_TIMEOUT` | PERSISTENCE | 500 | Sanity write operation timed out |
| `READBACK_FAILED` | PERSISTENCE | 500 | Post-write read-back failed (may have persisted) |
| `SERVER_ERROR` | SERVER | 500 | Unexpected server-side error |
| `RATE_LIMITED` | SERVER | 429 | Rate limit exceeded |

---

## 4. Admin API Route Reference

All admin routes require authentication and CSRF validation on state-mutating methods.

Entity responses include `_rev` field. Mutation requests must include `_rev` as concurrency token (except creates).

### 4.1 Hero

#### GET /api/admin/hero
Returns Hero singleton or uninitialized response.

#### PUT /api/admin/hero
Creates or updates Hero singleton.

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `mediaType` | `"image" \| "video"` | Yes |
| `image` | Sanity Image ref | Conditional |
| `videoUrl` | string | Conditional |
| `videoPoster` | Sanity Image ref | No |
| `headline` | string (max 100) | Yes |
| `subheadline` | string (max 250) | No |
| `ctaLabel` | string (max 50) | Yes |
| `ctaUrl` | string | Yes |
| `overlayOpacity` | number (0–100) | No |
| `_rev` | string | Yes (concurrency token, omit on first initialize) |

**Errors:** `CSRF_INVALID`, `VALIDATION_FAILED`, `CONFLICT`, `WRITE_FAILED`, `WRITE_TIMEOUT`, `READBACK_FAILED`

---

### 4.2 About

#### GET /api/admin/about
Returns About singleton or uninitialized response.

#### PUT /api/admin/about

| Field | Type | Required |
|-------|------|----------|
| `pageTitle` | string (max 100) | Yes |
| `intro` | string (max 500) | Yes |
| `body` | Portable Text array | Yes |
| `teamSectionTitle` | string (max 80) | No |
| `teamMembers` | TeamMember[] | No |
| `coverImage` | Sanity Image ref | No |
| `_rev` | string | Yes (omit on first initialize) |

---

### 4.3 Services

#### GET /api/admin/services
Returns all Services ordered by `order` ascending.

#### POST /api/admin/services

| Field | Type | Required |
|-------|------|----------|
| `title` | string (max 100) | Yes |
| `slug` | string | Yes |
| `shortDescription` | string (max 200) | Yes |
| `body` | Portable Text | Yes |
| `icon` | string (max 50) | No |
| `coverImage` | Sanity Image ref | No |
| `isActive` | boolean | No (default: false) |
| `order` | number (int ≥ 0) | Yes |
| `seoTitle` | string (max 70) | No |
| `seoDescription` | string (max 160) | No |

**Errors:** `CSRF_INVALID`, `VALIDATION_FAILED`, `SLUG_CONFLICT`, `WRITE_FAILED`, `READBACK_FAILED`

#### GET /api/admin/services/[id]
Returns single Service.

#### PUT /api/admin/services/[id]
Updates Service. Same fields as POST plus `_rev` (required).

#### DELETE /api/admin/services/[id]
Hard-deletes Service.

**Response:**
```json
{
  "success": true,
  "requestId": "uuid-v4",
  "data": { "deleted": true, "id": "sanity-doc-id" }
}
```

#### PATCH /api/admin/services/reorder
Reorders Services. All-or-nothing.

**Request body:**
```json
{
  "items": [
    { "id": "doc-id", "order": 0 },
    { "id": "doc-id", "order": 1 }
  ]
}
```

---

### 4.4 Projects

#### GET /api/admin/projects
Returns all non-archived Projects ordered by `order` ascending.

**Query parameters:**
- `includeTestimonials=true` — include project testimonials
- `archived=true` — return archived projects instead of active (for Archived Projects view)

#### POST /api/admin/projects
Creates new Project. Fields per DOC-020 §3.4 (excluding system fields and archive fields).

#### GET /api/admin/projects/[id]
Returns single Project by ID regardless of archive state.

#### PUT /api/admin/projects/[id]
Updates Project content fields. Requires `_rev`.

#### PATCH /api/admin/projects/[id]/archive
Archives a Project and all associated Testimonials (atomic transaction).

**Request body:**
```json
{ "_rev": "current-rev" }
```

**Response:** Success envelope with verified Project snapshot (showing `isArchived: true`).

**Cascade:** All associated Testimonials archived in same Sanity transaction.

**Errors:** `CSRF_INVALID`, `CONFLICT`, `NOT_FOUND`, `WRITE_FAILED`, `READBACK_FAILED`

#### PATCH /api/admin/projects/[id]/restore
Restores an archived Project and all associated Testimonials (atomic).

**Request body:**
```json
{ "_rev": "current-rev" }
```

**Response:** Success envelope with verified Project snapshot (`isArchived: false`, `isActive: false`).

**Errors:** `CSRF_INVALID`, `CONFLICT`, `NOT_FOUND`, `WRITE_FAILED`, `READBACK_FAILED`

#### DELETE /api/admin/projects/[id]
Permanently deletes an **archived** Project and all associated Testimonials.

**Precondition:** Project must have `isArchived: true`. If not, returns `409 ARCHIVE_REQUIRED`.

**Confirmation requirement enforced at client:** Operator must type project title. This is a UX constraint (DOC-050 §5.5) — the API accepts the request if authenticated.

**Response:**
```json
{
  "success": true,
  "requestId": "uuid-v4",
  "data": {
    "deleted": true,
    "id": "sanity-doc-id",
    "testimonialsDeleted": 3
  }
}
```

**Errors:** `CSRF_INVALID`, `NOT_FOUND`, `ARCHIVE_REQUIRED`, `WRITE_FAILED`

#### PATCH /api/admin/projects/reorder
Same semantics as services reorder. Applies to non-archived projects only.

---

### 4.5 Testimonials

#### GET /api/admin/testimonials
Returns all non-archived Testimonials.

**Query parameters:**
- `projectId` — filter by project
- `archived=true` — return archived testimonials (only needed for diagnostic purposes; normal restore flow goes through project restore)

#### POST /api/admin/testimonials
Creates new Testimonial. Fields per DOC-020 §3.5 (excluding system fields and archive fields).

#### PUT /api/admin/testimonials/[id]
Updates Testimonial. Requires `_rev`.

#### DELETE /api/admin/testimonials/[id]
Hard-deletes Testimonial (not archived — this is a standalone testimonial delete within an active project). Requires project to be non-archived.

**Response:**
```json
{
  "success": true,
  "requestId": "uuid-v4",
  "data": { "deleted": true, "id": "sanity-doc-id" }
}
```

#### PATCH /api/admin/testimonials/[id]/featured
Toggles `featuredOnPortfolio`.

**Request body:**
```json
{ "featuredOnPortfolio": true, "_rev": "current-rev" }
```

---

### 4.6 Articles

#### GET /api/admin/articles
Returns all Articles ordered by `createdAt` descending.

**Query parameters:**
- `status=draft|published` — filter by status

#### POST /api/admin/articles
Creates Article. `isDraft = true`, `isPublished = false` set by API regardless of client input.

Fields: `title`, `slug`, `excerpt`, `body`, `coverImage`, `category`, `tags`, `authorName`, `seoTitle`, `seoDescription`.

#### GET /api/admin/articles/[id]
Returns single Article.

#### PUT /api/admin/articles/[id]
Updates Article content fields only. Lifecycle fields (`isDraft`, `isPublished`, `publishedAt`) are not accepted here. Requires `_rev`.

#### DELETE /api/admin/articles/[id]
Hard-deletes Article.

#### PATCH /api/admin/articles/[id]/publish
Sets `isDraft = false`, `isPublished = true`, `publishedAt = now()` (if not set). Requires `_rev`.

#### PATCH /api/admin/articles/[id]/unpublish
Sets `isDraft = true`, `isPublished = false`. Does not modify `publishedAt`. Requires `_rev`.

---

### 4.7 Site Settings

#### GET /api/admin/site-settings
Returns SiteSettings singleton (full payload including all UIText fields) or uninitialized response.

#### PUT /api/admin/site-settings
Creates or updates SiteSettings. Accepts all fields defined in DOC-020 §3.7. Requires `_rev` (omit on first initialize).

---

### 4.8 Media Upload

#### POST /api/admin/upload
Uploads image to Sanity asset pipeline.

Requires authentication. Does not require CSRF token (file upload from the same authenticated session is considered CSRF-safe given HttpOnly session cookies and origin validation).

Constraints: JPEG/PNG/WebP/GIF, max 10 MB.

**Response:**
```json
{
  "success": true,
  "requestId": "uuid-v4",
  "data": {
    "assetId": "sanity-asset-id",
    "url": "https://cdn.sanity.io/...",
    "width": 1920,
    "height": 1080
  }
}
```

---

### 4.9 Public Contact Form

#### POST /api/public/contact

Not an admin route. Does not require authentication. Rate limited: 5 req/min per IP.

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `name` | string (max 100) | Yes |
| `email` | string (email) | Yes |
| `phone` | string (max 30) | No |
| `company` | string (max 100) | No |
| `message` | string (max 2000) | Yes |

No storage. Delivers notification only.

**Response:**
```json
{
  "success": true,
  "requestId": "uuid-v4",
  "data": { "delivered": true }
}
```

---

## 5. HTTP Method Summary

| Route | GET | POST | PUT | PATCH | DELETE |
|-------|-----|------|-----|-------|--------|
| `/api/admin/hero` | ✓ | — | ✓ | — | — |
| `/api/admin/about` | ✓ | — | ✓ | — | — |
| `/api/admin/services` | ✓ | ✓ | — | — | — |
| `/api/admin/services/[id]` | ✓ | — | ✓ | — | ✓ |
| `/api/admin/services/reorder` | — | — | — | ✓ | — |
| `/api/admin/projects` | ✓ | ✓ | — | — | — |
| `/api/admin/projects/[id]` | ✓ | — | ✓ | — | ✓ |
| `/api/admin/projects/[id]/archive` | — | — | — | ✓ | — |
| `/api/admin/projects/[id]/restore` | — | — | — | ✓ | — |
| `/api/admin/projects/reorder` | — | — | — | ✓ | — |
| `/api/admin/testimonials` | ✓ | ✓ | — | — | — |
| `/api/admin/testimonials/[id]` | — | — | ✓ | — | ✓ |
| `/api/admin/testimonials/[id]/featured` | — | — | — | ✓ | — |
| `/api/admin/articles` | ✓ | ✓ | — | — | — |
| `/api/admin/articles/[id]` | ✓ | — | ✓ | — | ✓ |
| `/api/admin/articles/[id]/publish` | — | — | — | ✓ | — |
| `/api/admin/articles/[id]/unpublish` | — | — | — | ✓ | — |
| `/api/admin/site-settings` | ✓ | — | ✓ | — | — |
| `/api/admin/upload` | — | ✓ | — | — | — |
| `/api/public/contact` | — | ✓ | — | — | — |

---

## 6. Observability

### 6.1 Mutation Log Entry

Every mutation generates a structured log:

```json
{
  "level": "info | warn | error",
  "type": "mutation",
  "requestId": "uuid-v4",
  "route": "/api/admin/projects/[id]",
  "method": "PUT",
  "entityType": "project",
  "entityId": "sanity-doc-id",
  "outcome": "SUCCESS | FAILURE",
  "errorCode": "READBACK_FAILED",
  "mayHavePersisted": true,
  "durationMs": 142,
  "timestamp": "ISO-8601"
}
```

Mutation logs do not include payload content or PII.

### 6.2 Security Event Log

```json
{
  "level": "warn",
  "type": "security_event",
  "requestId": "uuid-v4",
  "event": "CSRF_INVALID | UNAUTHORIZED | RATE_LIMITED | ORIGIN_REJECTED",
  "route": "/api/admin/projects",
  "ip": "x.x.x.x",
  "timestamp": "ISO-8601"
}
```

### 6.3 Rate Limit Log

```json
{
  "level": "warn",
  "type": "rate_limit",
  "requestId": "uuid-v4",
  "route": "/api/public/contact",
  "ip": "x.x.x.x",
  "timestamp": "ISO-8601"
}
```

---

*End of document.*
