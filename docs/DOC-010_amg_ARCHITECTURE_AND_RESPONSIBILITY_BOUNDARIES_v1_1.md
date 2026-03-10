# DOC-010 — AMG Architecture & Responsibility Boundaries

**Status:** Canonical
**Effective Date:** March 9, 2026
**Version:** 1.1
**Timestamp:** 20260309-1555 (CST)
**Governing Document:** DOC-000 — AMG System Charter & Product Promise (v1.1)

---

### Revision History

| Version | Timestamp (CST) | Changes |
|---------|-----------------|---------|
| 1.0 | 20260309-1532 | Initial release |
| 1.1 | 20260309-1555 | §6 Mutation Lifecycle hardened for eventual consistency — added bounded retry window, read-back verification requirements, false-negative prevention rules; §5 Authentication hardened — added CSRF, cookie configuration, origin validation, session hardening; §7 added as Security Architecture section; §8 Singleton Identity extended with `_rev` as primary concurrency token; §9 updated rate limiting; §10 added Observability Requirements; references to DOC-060 and DOC-070 added |

---

### Document Standards

Canonical documents are written in English. All timestamps use Central Standard Time (CST).

---

## 1. Executive Intent

Architectural boundaries exist because without them, every component eventually tries to compensate for every other component. The result is a system where nothing is responsible for anything because everything is partially responsible for everything.

Blurred ownership creates silent failure. When a website renders hard-coded content instead of CMS content, the page looks correct — but the operator cannot change it. When an admin panel accepts edits but the persistence layer is missing, the save appears to work — but the data is gone on reload. When authentication exists on some routes but not others, the admin appears protected — but the boundary has holes.

This document defines which component owns what, what each component is forbidden from doing, and how components interact across boundaries. These boundaries are structural, not advisory. Violating them produces defects, not trade-offs.

---

## 2. System Architecture

### 2.1 Target Architecture

**Application Framework:** Next.js 14+ with App Router, server-side rendering, and serverless API routes. TypeScript in strict mode. Zero suppressions.

**Public Website Layer:** Server-rendered pages that retrieve all content from the Content Store at render time. No hard-coded content in templates or components. Responsive across all viewport sizes. All pages in English.

**Back Office Layer:** Authenticated administrative interface at `/admin` and sub-routes. Organized as a page-first CMS interface (per DOC-000 §3.5 and DOC-030). Navigation structure mirrors the public site's page inventory.

**API Layer:** Protected routes under `/api/admin/` for all content mutations. Public endpoint for contact form submission only (no lead storage). Every admin route enforces authentication before any processing. Every mutation endpoint implements the full mutation lifecycle (§6). Input validation via Zod on every endpoint.

**Content Store:** Sanity CMS — the authoritative source for all content. Single project, single dataset per deployment.

**Authentication:** NextAuth with Google OAuth provider. Email whitelist configured per deployment via `ADMIN_ALLOWED_EMAILS`.

**Hosting:** Netlify with serverless functions.

---

## 3. Responsibility Domains

### 3.1 Public Website Domain

**Responsibilities:**

- Rendering public pages from Content Store data
- Presenting the contact form and delivering submissions (email notification — no storage)
- Generating SEO metadata, structured data (JSON-LD), Open Graph tags per DOC-070
- Generating sitemap.xml and robots.txt per DOC-070
- Loading Google Analytics when Measurement ID is configured
- Rendering social links and contact details from SiteSettings
- Rendering all UI text from the CMS UIText fields (per DOC-020 §3.7)

**Forbidden Behaviors:**

- Rendering hard-coded text of any kind that a public visitor could read
- Storing contact form submissions in any database
- Making unauthenticated calls to admin API routes
- Rendering demo data or hardcoded fallback when Content Store returns empty
- Applying business logic to content before rendering

### 3.2 Back Office Domain

**Responsibilities:**

- Providing an authenticated, page-oriented interface for all CMS operations
- Reading current content state from the Content Store via admin API routes
- Submitting content mutations via admin API routes
- Displaying persisted state accurately on every load
- Communicating every mutation outcome (success or failure) to the operator
- Preserving operator input on failed mutations (MUT-005)
- Detecting uninitialized singleton state and prompting explicit initialization
- Providing CSRF tokens on all state-mutating requests

**Forbidden Behaviors:**

- Displaying a success state when the mutation failed
- Overwriting operator form state with empty or unverified API response data
- Fabricating empty entity objects for uninitialized singletons
- Allowing access to any route without verified authentication
- Writing to Sanity directly without routing through the API Layer
- Rendering raw API error messages to the operator (messages must be translated to user-facing English per DOC-030 §10.1)

### 3.3 API Layer

**Responsibilities:**

- Enforcing authentication on every admin route as the first operation
- Validating all input via Zod before any persistence operation
- Executing the full mutation lifecycle (§6) on every mutation
- Returning a verified canonical snapshot on every successful mutation
- Returning a structured error envelope on every failure
- Including `requestId` (UUID v4) in every response
- Enforcing CSRF token validation on all state-mutating requests
- Generating structured server-side log entries for every mutation and every security event
- Sanitizing rich text content before persistence (DOC-060 §6)

**Forbidden Behaviors:**

- Returning `success: true` without verified canonical read-back
- Returning `success: true` with null, empty, or unverified data
- Processing any admin request without verifying authentication
- Returning stack traces or internal implementation details in error responses
- Logging sensitive data (tokens, passwords, full request bodies containing PII) in structured logs

### 3.4 Content Domain (Sanity CMS)

**Responsibilities:**

- Storing all content entities
- Providing `_rev` (document revision identifier) on all document reads for concurrency control
- Enforcing schema constraints on all documents
- Providing read access for SSR and admin reads
- Providing write access for admin mutations via authenticated API routes only

**Forbidden Behaviors:**

- Direct client-side writes from the public website
- Direct client-side writes from the Back Office without routing through the API Layer

---

## 4. Component Interaction Rules

### 4.1 Public Site → Content Store

Public pages retrieve content from Sanity using a read-only client (`useCdn: false` for SSR accuracy). No public page calls an admin API route. No public page writes to Sanity.

### 4.2 Back Office → API Layer → Content Store

All content mutations flow: Back Office → API Layer → Content Store. The Back Office never writes to Sanity directly. The Back Office includes CSRF tokens on all POST/PUT/PATCH/DELETE requests.

### 4.3 Public Site → Contact Form Endpoint

The contact form submits to `/api/public/contact`. This endpoint validates, delivers notification, and returns a response. It does not persist submissions.

### 4.4 No Cross-Domain Shortcuts

No legitimate code path bypasses the governed flow. Every mutation: authenticated request → CSRF validated → input validated → persisted → verified read-back → confirmed response.

---

## 5. Authentication Architecture

### 5.1 Provider

NextAuth with Google OAuth. No other authentication mechanism is provided or permitted.

### 5.2 Email Whitelist

Access is restricted to email addresses in `ADMIN_ALLOWED_EMAILS`. Authenticated Google sessions that do not match are rejected immediately.

### 5.3 Dual-Layer Enforcement

Authentication is enforced at two independent layers:
1. **Middleware layer** (`middleware.ts`) — intercepts requests to `/admin/*` and `/api/admin/*` before route handlers
2. **Route handler layer** — every admin API route calls `requireAdmin()` as the first operation

Both layers independently verify the session. Passing one does not exempt from the other.

### 5.4 Session Configuration

- Strategy: JWT
- Expiry: 24 hours
- Cookie name: explicitly configured (not default)
- Cookie flags: `HttpOnly`, `Secure` (production), `SameSite=Lax`
- Sessions are validated server-side on every request

### 5.5 CSRF Protection

All state-mutating admin API routes (POST, PUT, PATCH, DELETE) require a valid CSRF token. The CSRF token is:
- Generated server-side per session
- Delivered to the Back Office as a non-HttpOnly cookie or via an API endpoint
- Submitted by the Back Office as a request header (`X-CSRF-Token`)
- Validated by the API Layer before processing the mutation

GET requests are exempt from CSRF validation. Requests that fail CSRF validation receive `403 Forbidden` with error code `CSRF_INVALID`. Full CSRF specification is in DOC-060 §3.

### 5.6 Origin Validation

Admin API routes validate the `Origin` or `Referer` header on state-mutating requests. Requests originating from unexpected origins are rejected. Expected origins are configured per deployment via environment variable `ALLOWED_ORIGINS`.

---

## 6. Mutation Lifecycle (MUT-002 — Hardened)

Every mutation endpoint MUST traverse the following state machine:

```
INIT → CSRF_CHECK → WRITE_ATTEMPT → READ_BACK_VERIFY → SUCCESS
                                                     → FAILURE
```

### 6.1 INIT

Generate `requestId` (UUID v4). Record start timestamp. Log mutation start with route, method, and requestId.

### 6.2 CSRF_CHECK

Validate the CSRF token. On failure: return `403 CSRF_INVALID` immediately. No further processing.

### 6.3 WRITE_ATTEMPT

Execute the Sanity write operation using an atomic transaction where multiple documents are affected.

If the write operation:
- Times out → transition to FAILURE with code `WRITE_TIMEOUT`
- Returns an error → transition to FAILURE with code `WRITE_FAILED`
- Returns an unexpected response shape → transition to FAILURE with code `WRITE_FAILED`

### 6.4 READ_BACK_VERIFY

**Purpose:** Confirm that the write persisted correctly before declaring success.

**Mechanism:** Perform a direct Sanity read of the entity using its stable `_id` with `useCdn: false`. This bypasses the CDN and reads from the primary data store.

**Sanity consistency note:** Sanity applies writes to its primary dataset synchronously. Reads with `useCdn: false` bypass the CDN edge cache and read from the primary. Immediate post-write read-back using `useCdn: false` is therefore safe and does not require polling in normal operation. However, to protect against transient infrastructure edge cases:

**Retry policy:**
- Attempt read-back immediately after write acknowledgment
- If read-back returns null or unexpected shape on first attempt: wait 200ms and retry once
- If second attempt also fails: transition to FAILURE with code `READBACK_FAILED`
- Maximum total read-back time: 2 seconds. If not resolved within 2 seconds: FAILURE

**Verification criteria:** Read-back is considered verified when:
- The returned document's `_id` matches the written document's `_id`
- The returned document's `_rev` differs from the pre-write `_rev` (confirming a new revision was created)
- Required fields are present and non-null

If any verification criterion fails, the read-back is not verified and the mutation transitions to FAILURE.

### 6.5 SUCCESS

Return the verified canonical snapshot in the success envelope. Include `requestId`. Log outcome with duration.

Success is only declared after all verification criteria in §6.4 are satisfied. There is no SUCCESS state without a verified canonical snapshot.

### 6.6 FAILURE

Return a structured error envelope. Include `requestId`. Do not indicate success. Do not return partial data. Do not expose internal error details. Log the failure with error code and duration.

### 6.7 False Negative Prevention

A "false negative" is a situation where the write succeeded but read-back failed, causing the API to report failure when the data is actually persisted. To minimize false negatives:

- Read-back uses `useCdn: false` to bypass eventual consistency at the CDN layer
- The two-attempt retry window (§6.4) absorbs transient read latency
- The API MUST NOT roll back or undo a Sanity write in response to a read-back failure — the write stands, only the response is FAILURE
- The operator is informed: "Your changes may have been saved. Please reload to verify before retrying."
- This specific message is used only when the write was acknowledged by Sanity but read-back failed. It is distinguished from a clean write failure where the write was not acknowledged.

---

## 7. Security Architecture

Security requirements are specified in detail in DOC-060. This section defines the architectural principles.

### 7.1 Security Headers

All HTTP responses (public and admin) must include security headers as defined in DOC-060 §4. Headers are set at the Next.js middleware layer and cannot be overridden per-route.

### 7.2 Input Sanitization

All user-supplied input must be validated (Zod) before use. Rich text content (Portable Text) must be sanitized before persistence to prevent stored XSS. Sanitization requirements are defined in DOC-060 §6.

### 7.3 Output Encoding

All content rendered in the public site is rendered via React's default JSX escaping. No use of `dangerouslySetInnerHTML` is permitted except for Portable Text rendering, which must use a reviewed and approved renderer.

### 7.4 Error Response Discipline

Error responses must not expose:
- Stack traces
- Internal implementation details
- Database query structures
- File system paths
- Environment variable names

Structured error codes and human-readable English messages are the only permitted error response content.

---

## 8. Singleton Identity (MUT-001)

Singleton entities (Hero, About, SiteSettings) MUST have stable canonical `_id` values namespaced as `singleton.<type>`:

- Hero: `_id: "singleton.hero"`
- About: `_id: "singleton.about"`
- SiteSettings: `_id: "singleton.siteSettings"`

Fetch-by-type-positional (`*[_type == "hero"][0]`) is forbidden. All singleton reads and writes use the stable `_id` directly.

---

## 9. Optimistic Concurrency (MUT-CON)

### 9.1 Primary Token: `_rev`

The primary concurrency token is Sanity's `_rev` field — the document revision identifier. `_rev` is managed by Sanity and changes atomically on every successful mutation. It is not application-managed and cannot be spoofed by the client.

**Mutation flow:**
1. API GET response includes `_rev` in the entity payload
2. Client stores `_rev` alongside the loaded document
3. Client submits `_rev` in every PUT/PATCH mutation request
4. Before writing, the API reads the current `_rev` from Sanity
5. If submitted `_rev` ≠ current `_rev`: another mutation has occurred → reject with `CONFLICT`
6. If `_rev` matches: proceed with write

### 9.2 Secondary Timestamp: `updatedAt`

`updatedAt` is retained as a display timestamp (human-readable "last modified" indicator) and as a secondary signal in conflict detection, but it is NOT the primary concurrency lock. `updatedAt` alone is insufficient as a concurrency token because application-set timestamps can collide on fast writes within the same millisecond or under serverless clock skew.

### 9.3 Singleton Initialization Safety (INIT-001)

Admin singleton GET endpoints MUST NOT fabricate synthetic empty entity objects when the canonical `_id` does not exist. When uninitialized:
- Return `data: null`, `initialized: false`
- Back Office must display explicit initialization prompt
- No implicit creation on read

---

## 10. Rate Limiting

| Route Category | Limit | Dimension |
|---------------|-------|-----------|
| Admin API routes | 60 req/min | Per session |
| Auth routes (`/api/auth/*`) | 10 req/min | Per IP |
| Public contact form | 5 req/min | Per IP |
| Media upload | 20 req/min | Per session |

Rate limiting is applied at the API Layer. Exceeded limits return `429 Too Many Requests` with a `Retry-After` header. All rate limit events are logged as structured entries with `type: "rate_limit"`.

---

## 11. Observability Requirements

Every production request must leave an auditable trace. Observability is governed in detail in DOC-040 §6 and DOC-060 §8.

### 11.1 Request Correlation

Every request generates a `requestId` (UUID v4) at the start of processing. This ID is:
- Included in every API response envelope
- Included in every structured log entry for that request
- Available for correlation in monitoring platforms

### 11.2 Mutation Audit Log

Every mutation (create, update, delete, publish, archive) generates a structured log entry:

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
  "durationMs": 142,
  "timestamp": "ISO-8601"
}
```

Mutation logs do not include payload content or PII. They record what happened, not what the content was.

### 11.3 Security Event Log

Authentication failures, CSRF violations, rate limit hits, and origin rejections generate structured security event logs with `type: "security_event"`. Specification in DOC-060 §8.

### 11.4 Log Discipline

- Logs never include: session tokens, OAuth tokens, API keys, full request bodies, passwords, or raw form input
- Logs always include: `requestId`, `timestamp`, `route`, `outcome`
- Log format: structured JSON (not free-form text)

---

## 12. Compliance

Any system behavior that contradicts the boundaries defined in this document is a defect. Revisions require documented rationale, updated version number and timestamp, and explicit acknowledgment of superseded content.

---

*End of document.*
