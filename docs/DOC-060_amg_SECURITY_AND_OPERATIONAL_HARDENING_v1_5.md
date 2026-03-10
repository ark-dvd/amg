# DOC-060 — AMG Security & Operational Hardening

**Status:** Canonical
**Effective Date:** March 10, 2026
**Version:** 1.5
**Timestamp:** 20260310-1435 (CST)
**Governing Document:** DOC-000 — AMG System Charter & Product Promise (v1.1)

---

### Revision History

| Version | Timestamp (CST) | Changes |
|---------|-----------------|---------|
| 1.0 | 20260309-1555 | Initial release |
| 1.1 | 20260310-1020 | §10 Rate Limiting hardened; §11 Contact Form Abuse Protection added |
| 1.2 | 20260310-1302 | §14 Dependency Security Governance added — npm audit requirements, patch SLA, lockfile policy, abandoned dependency prohibition, supply-chain incident classification |
| 1.3 | 20260310-1321 | §4.2 CSP Nonce Governance added |
| 1.4 | 20260310-1356 | §4.3 Additional Isolation Headers added; §15 Production Error Response Discipline added |
| 1.5 | 20260310-1435 | §4.3 CORP value rationale added — explicit same-origin justification for AMG deployment model; §15 cross-reference corrected from DOC-040 §5 to DOC-040 §3.3 |

---

### Document Standards

Canonical documents are written in English. All timestamps use Central Standard Time (CST).

---

## 1. Executive Intent

Security is a governing constraint, not a phase-two concern. Every route, every input, every response, and every session is subject to the requirements defined in this document. There is no implementation state in which security requirements are deferred.

A publicly accessible website with an administrative backend is an attack surface. The AMG system manages client-visible content, handles form submissions from the public, and provides authenticated write access to a content store. Failures in authentication, session management, input handling, or output encoding can result in content defacement, data exposure, unauthorized administrative access, or service disruption.

This document specifies what must be implemented, not how to implement it.

---

## 2. Authentication Hardening

### 2.1 Provider

Google OAuth via NextAuth is the only authentication mechanism. No username/password fallback is permitted. No API key authentication for the Back Office.

### 2.2 Email Whitelist Enforcement

The `ADMIN_ALLOWED_EMAILS` environment variable contains a comma-separated list of authorized email addresses. This list is evaluated server-side on every session creation and on every admin request via `requireAdmin()`. A valid Google OAuth session that is not in the whitelist is rejected with `401 Unauthorized`. The whitelist is never evaluated client-side.

### 2.3 Session Token Security

- Session tokens are stored in HttpOnly cookies (inaccessible to JavaScript)
- Session tokens are transmitted only over HTTPS (`Secure` cookie flag, always set in production)
- `SameSite=Lax` is the minimum acceptable setting. `SameSite=Strict` is preferred if it does not break OAuth callback flows
- Session tokens must not appear in URL query strings, log files, or response bodies
- Token expiry: 24 hours. No sliding expiry. Expired sessions require re-authentication.

### 2.4 Session Invalidation

When the operator signs out, the session token is invalidated server-side. Server-side invalidation requires maintaining a session blocklist or using short-lived tokens with server-side state. Client-side cookie clearing alone is insufficient.

### 2.5 Login Rate Limiting

The `/api/auth/*` endpoint is rate limited at 10 requests per minute per IP. Failed authentication attempts are logged as security events.

---

## 3. CSRF Protection

### 3.1 Requirement

All state-mutating admin API routes (POST, PUT, PATCH, DELETE under `/api/admin/*`) require a valid CSRF token.

### 3.2 Implementation Model

**Double Submit Cookie pattern:**
- Server sets a non-HttpOnly, `SameSite=Strict` CSRF token cookie on authenticated session creation
- Back Office JavaScript reads the CSRF token from the cookie
- Back Office submits the CSRF token as `X-CSRF-Token` header on every mutating request
- API layer validates `X-CSRF-Token` header value against the CSRF token associated with the session

Synchronizer Token pattern is also acceptable. The requirement is that a CSRF attack from a third-party origin cannot succeed.

### 3.3 GET Request Exemption

GET requests are exempt from CSRF validation. GET requests under `/api/admin/*` must remain idempotent and non-mutating.

### 3.4 CSRF Failure Response

CSRF validation failure returns `403 CSRF_INVALID`. The failure is logged as a security event (DOC-090 §4.3).

---

## 4. Security Headers

All HTTP responses must include the following security headers, set at the Next.js `next.config.js` or middleware layer:

| Header | Required Value | Purpose |
|--------|---------------|---------|
| `Content-Security-Policy` | Defined per §4.1 | Prevents XSS and injection |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Enforces HTTPS |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer exposure |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Restricts browser feature access |

### 4.1 Content Security Policy (CSP)

CSP must:
- Default to `default-src 'self'`
- Explicitly permit Sanity CDN image domains
- Explicitly permit Google OAuth domains
- Explicitly permit Google Analytics domain if configured
- Explicitly permit video embed domains if hero video from Vimeo/YouTube
- Prohibit `unsafe-eval`
- Minimize or eliminate `unsafe-inline` for scripts (use nonces if inline scripts required)

The exact CSP value is defined per deployment. A CSP using `*` wildcards for script sources is non-compliant.

### 4.2 CSP Nonce Governance

Inline scripts represent a persistent XSS risk. When an inline `<script>` block exists in the page without a nonce, any attacker who can inject arbitrary content into the page can execute arbitrary JavaScript, because the browser cannot distinguish legitimate inline scripts from injected ones. Nonces solve this by binding each allowed inline script to a cryptographically unpredictable value that is unique per request.

**Inline script prohibition:**

Inline `<script>` blocks without a nonce attribute are prohibited. If a script cannot be moved to an external file and deferred, it must be protected by a nonce.

**Nonce rules:**

- Every inline `<script>` block must include a `nonce` attribute: `<script nonce="[value]">...</script>`
- The CSP `script-src` directive must include the corresponding nonce: `script-src 'self' 'nonce-[value]'`
- The nonce value must be generated **per request** — a new cryptographically random value for every HTTP response. A static or build-time nonce provides no XSS protection because an attacker can read it from the page source and reuse it.
- Nonce values must be generated using a cryptographically secure random source (e.g. `crypto.randomUUID()` or `crypto.getRandomValues()`). Predictable or sequential values are non-compliant.
- The nonce value must not appear in logs, error messages, or response bodies other than the `<script nonce="...">` attribute itself and the `Content-Security-Policy` header.

**`unsafe-inline` prohibition:**

`unsafe-inline` in `script-src` is prohibited. `unsafe-inline` negates all nonce and hash protections by permitting any inline script to execute, including attacker-injected ones. There are no deployment conditions under which `unsafe-inline` is acceptable for script sources.

**Exception:** If a third-party integration (e.g. an analytics library) injects inline scripts that cannot be controlled, and nonces cannot be applied to those scripts, the integration is incompatible with the CSP requirements of this system. The integration must be replaced with one that supports nonce-based CSP, or it must not be included.

**Next.js implementation note:** Next.js App Router supports nonce-based CSP via middleware. The nonce is generated in `middleware.ts`, set in the CSP header, and passed to the Next.js rendering context. Server Components and the `<Script>` component accept the nonce prop. This is the governed implementation pattern.

### 4.3 Additional Isolation Headers

Modern browsers provide document-level and resource-level isolation primitives that protect against cross-origin attacks — including XS-Leaks, Spectre-class side-channel attacks, and cross-window interaction exploits — that CSP alone cannot prevent. These headers are required on all HTTP responses.

| Header | Required Value | Purpose |
|--------|---------------|---------|
| `Cross-Origin-Opener-Policy` | `same-origin` | Prevents cross-origin documents from retaining a reference to this page's browsing context window. Blocks cross-window attacks and is required to enable `SharedArrayBuffer` isolation. |
| `Cross-Origin-Resource-Policy` | `same-origin` | Prevents other origins from loading this origin's resources via `<img>`, `<script>`, or `fetch`. Mitigates XS-Leak attacks that exploit cross-origin resource inclusion. |

**Configuration:** Both headers are configured globally at the framework level in `next.config.js` `headers()` alongside the security headers defined in §4. They are not set per-route. There are no route exemptions.

#### CORP Value Rationale

The `Cross-Origin-Resource-Policy` value is explicitly `same-origin`, not `same-site` or `cross-origin`. This choice is deliberate and is justified by AMG's deployment model as follows.

**What `same-origin` permits:** Any page served from the same origin (same scheme + hostname + port) may load resources from this origin. All same-origin requests — the AMG Next.js application loading its own JS bundles, CSS, and self-hosted fonts — are unaffected.

**What `same-origin` forbids:** Pages served from any other origin — including subdomains of the same registered domain — may not load resources from this origin via `<img>`, `<script>`, `<link>`, or `fetch`. An attacker-controlled page cannot include a `<script src="https://[amg-domain]/some-path">` that exploits cross-origin resource timing or response body side-channels.

**Why `same-origin` is correct for AMG:** AMG serves no resources that are intentionally consumable by foreign origins. Specifically:

- **CMS images** are served from Sanity's CDN (`cdn.sanity.io`), a separate origin with its own CORP posture. AMG's origin does not re-serve Sanity images. `same-origin` on AMG's origin does not affect Sanity CDN responses.
- **Fonts** are loaded via `next/font`, which self-hosts font files at build time. These font files are served from AMG's own origin and consumed only by AMG's own pages — `same-origin` is correct.
- **No public API** consumed by third-party origins exists in AMG's architecture. AMG exposes no embeddable widget, no JSONP endpoint, and no publicly shared asset that another site is expected to include.
- **No CDN subdomain split** is used. AMG serves all resources from a single origin on Netlify. If a future deployment introduced a separate static asset subdomain (e.g. `assets.amg-domain.com`), that subdomain would be a different origin, and this policy would need to be reviewed via a governed amendment.

**Why `same-site` was not chosen:** `same-site` would permit any subdomain of the registered domain to load AMG's resources. Since AMG does not control which subdomains may exist on a client's domain, `same-site` introduces unnecessary exposure surface. `same-origin` is the more restrictive and therefore more correct value given AMG's architecture.

**Amendment required to relax:** Any future deployment scenario that requires resources from AMG's origin to be loadable by a different origin must be evaluated and approved via a Canon Amendment before `same-origin` is changed.

---

## 5. Input Validation

### 5.1 API Layer Validation

All API request bodies are validated using Zod schemas before any business logic. Validation failures return `400 VALIDATION_FAILED` with field-level errors.

### 5.2 String Sanitization

All string inputs must be sanitized before storage: leading/trailing whitespace stripped, null bytes rejected, control characters rejected (except newlines in multi-line fields).

### 5.3 URL Validation

All URL fields validated against strict URL pattern. Relative URLs and `javascript:` protocol rejected. Accepted protocols: `https://` and `http://`.

### 5.4 Slug Validation

Slug fields validated against `^[a-z0-9]+(?:-[a-z0-9]+)*$`. No uppercase, no spaces, no special characters.

---

## 6. Rich Text (Portable Text) Security

### 6.1 Input Sanitization

Portable Text submitted to the API is sanitized before persistence:
- Permits only block types defined in schema (H2, H3, normal, blockquote, lists)
- Permits only mark decorators defined in schema (strong, em, underline, strike, link)
- Strips any block types or marks not in the permitted list
- Validates link `href` values against URL rules (§5.3)
- Strips any `href` using `javascript:` protocol

### 6.2 Output Rendering

Portable Text rendered using `@portabletext/react`. No `dangerouslySetInnerHTML` on Portable Text output unless the renderer library requires it internally.

---

## 7. File Upload Security

### 7.1 Permitted Types

`/api/admin/upload` accepts only: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. All other MIME types rejected with `400 VALIDATION_FAILED`.

### 7.2 Magic Bytes Validation

MIME type validation is performed on actual file content (magic bytes inspection), not only on `Content-Type` header or file extension.

### 7.3 File Size Limit

Maximum 10 MB. Files exceeding this limit are rejected before full read.

### 7.4 Filename Sanitization

Original file names are not used. Sanity's pipeline assigns asset IDs. Original filenames are not stored or exposed.

---

## 8. Observability and Audit Logging

Security event logging is governed in full by DOC-090. Security events — authentication failures, CSRF violations, rate limit hits, origin rejections — generate structured security event log entries per DOC-090 §4.3.

Logs must never include: session tokens, OAuth tokens, API keys, full request bodies, passwords. Logs must include: `requestId`, event type, route, IP, timestamp.

---

## 9. Denial of Service Posture

### 9.1 Application-Layer Rate Limiting

Rate limits defined in §10 provide baseline DoS protection at the application layer. CDN-level and infrastructure-level DoS mitigation is the responsibility of the hosting platform (Netlify).

### 9.2 Request Size Limits

- Standard JSON requests: 1 MB maximum
- File upload requests: 10 MB maximum
- Requests exceeding size limits rejected with `413 Payload Too Large` before parsing

---

## 10. Rate Limiting

Rate limiting is enforced at the API Layer. All rate-limited routes return `429 Too Many Requests` on limit exceeded. All rate limit events generate structured log entries per DOC-090 §4.4.

### 10.1 Rate Limit Table

| Route Category | Limit | Window | Dimension |
|---------------|-------|--------|-----------|
| Admin API routes (`/api/admin/*`) | 60 req/min | Rolling 60s | Per authenticated session |
| Auth routes (`/api/auth/*`) | 10 req/min | Rolling 60s | Per IP |
| Public contact form (`/api/public/contact`) | 10 req/min | Rolling 60s | Per IP |
| Public contact form — burst | 3 req/10s | Rolling 10s | Per IP |
| Media upload (`/api/admin/upload`) | 20 req/min | Rolling 60s | Per authenticated session |

### 10.2 429 Response Contract

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
Content-Type: application/json
```

```json
{
  "success": false,
  "requestId": "uuid-v4",
  "error": {
    "category": "SERVER",
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please wait before trying again.",
    "retryable": true,
    "retryAfterSeconds": 30
  }
}
```

`Retry-After` and `retryAfterSeconds` must reflect the actual remaining window. The response must not reveal which rate limit category was hit.

### 10.3 Rate Limit Log Event

Per DOC-090 §4.4. `limitCategory` for operational diagnostics only — never surfaced in client responses.

### 10.4 Implementation Requirements

- Rate limiting enforced server-side only
- IP-based limits use rightmost trusted IP from `X-Forwarded-For`
- Session-based limits use session identifier after authentication is verified
- In serverless environments, per-instance counters are acceptable — limits are approximate under high concurrency

---

## 11. Contact Form Abuse Protection

### 11.1 CAPTCHA / Bot Protection Requirement

Every contact form submission must include a bot challenge token. Required implementation: **Cloudflare Turnstile** (preferred) or **reCAPTCHA v3**. Configured via `CAPTCHA_PROVIDER` and `CAPTCHA_SECRET_KEY`.

Validation flow: client receives challenge token → submits with form data → API validates server-side before any processing → missing/invalid token: `400 VALIDATION_FAILED` with approved message (§11.4). CAPTCHA secret key is never client-side.

### 11.2 Duplicate Submission Fingerprinting

Fingerprint: IP + lowercased trimmed email + SHA-256 of message body (first 200 chars). Deduplication window: 5 minutes. Duplicate submissions return standard success response without sending notification. Deduplication is best-effort in serverless environments.

### 11.3 Spam Throttling Policy

- **Honeypot field:** hidden, invisible to human users. If populated: silently discard (return success, no notification). Field name not advertised in page source comments.
- **URL threshold:** message body with more than `SPAM_URL_THRESHOLD` (default: 3) external URLs is held, not delivered.
- **Content length floor:** message body fewer than 10 characters: `400 VALIDATION_FAILED`.

### 11.4 Failure Response Messaging Policy

| Condition | Client-Facing Message |
|-----------|----------------------|
| CAPTCHA validation failed | "Please complete the verification step and try again." |
| Rate limit exceeded | "Too many requests. Please wait a moment before trying again." |
| Validation error | "Please check your submission and try again." |
| Server error | "Something went wrong. Please try again or contact us directly." |
| Duplicate / honeypot (silent) | [Standard success response] |

### 11.5 Contact Form Abuse Log Events

Per DOC-090 §4.5. Events: `CAPTCHA_FAILED`, `HONEYPOT_TRIGGERED`, `DUPLICATE_SUBMISSION`, `SPAM_SUSPECTED`.

---

## 12. Secret Management

### 12.1 Required Environment Variables

| Variable | Client-Side |
|----------|-------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes |
| `SANITY_API_TOKEN` | **No — server only** |
| `NEXTAUTH_SECRET` | **No — server only** |
| `NEXTAUTH_URL` | No |
| `GOOGLE_CLIENT_ID` | No |
| `GOOGLE_CLIENT_SECRET` | **No — server only** |
| `ADMIN_ALLOWED_EMAILS` | **No — server only** |
| `ALLOWED_ORIGINS` | No |
| `CONTACT_NOTIFICATION_EMAIL` | No |
| `CANONICAL_DOMAIN` | No |
| `CAPTCHA_PROVIDER` | No |
| `NEXT_PUBLIC_CAPTCHA_SITE_KEY` | Yes |
| `CAPTCHA_SECRET_KEY` | **No — server only** |
| `SPAM_URL_THRESHOLD` | No (default: 3) |

### 12.2 Secret Exposure Prevention

- Secrets are never logged, never in API responses or error messages
- `NEXT_PUBLIC_*` variables are the only values intentionally exposed to client-side code
- `SANITY_API_TOKEN` must never appear in client-side bundles — verified via bundle analysis

---

## 13. Compliance Checklist

| # | Requirement | Section |
|---|-------------|---------|
| 1 | Google OAuth with production credentials | §2.1 |
| 2 | Email whitelist populated | §2.2 |
| 3 | Session cookies: HttpOnly + Secure + SameSite | §2.3 |
| 4 | Session invalidation server-side | §2.4 |
| 5 | CSRF protection on all mutating admin routes | §3 |
| 6 | All security headers configured | §4 |
| 7 | CSP defined and tested | §4.1 |
| 8 | Portable Text sanitization | §6.1 |
| 9 | File upload magic bytes validation | §7.2 |
| 10 | Admin API rate limiting (60/min per session) | §10.1 |
| 11 | Auth route rate limiting (10/min per IP) | §10.1 |
| 12 | Contact form rate limiting (10/min + burst) | §10.1 |
| 13 | Upload rate limiting (20/min per session) | §10.1 |
| 14 | 429 responses include `Retry-After` header | §10.2 |
| 15 | CAPTCHA/Turnstile on contact form | §11.1 |
| 16 | Honeypot field on contact form | §11.3 |
| 17 | Duplicate fingerprinting active | §11.2 |
| 18 | Contact form error messages use approved set | §11.4 |
| 19 | Request body size limits enforced | §9.2 |
| 20 | All secrets in deployment environment | §12.1 |
| 21 | `SANITY_API_TOKEN` absent from client bundles | §12.2 |
| 22 | Security event logging active | §8 |
| 23 | No stack traces in production error responses | §15 |
| 24 | `npm audit` passes with no HIGH/CRITICAL vulnerabilities | §14.1 |
| 25 | `package-lock.json` committed | §14.3 |
| 26 | All inline `<script>` blocks include nonce attribute | §4.2 |
| 27 | CSP `script-src` uses `'nonce-[value]'`, not `unsafe-inline` | §4.2 |
| 28 | Nonce value generated per-request from cryptographically secure source | §4.2 |
| 29 | `Cross-Origin-Opener-Policy: same-origin` header configured globally | §4.3 |
| 30 | `Cross-Origin-Resource-Policy: same-origin` header configured globally | §4.3 |
| 31 | Production error responses contain no internal file paths | §15 |
| 32 | Production error responses contain no environment variable values | §15 |

---

## 14. Dependency Security Governance

### 14.1 Vulnerability Audit Requirement

Production dependencies must pass `npm audit` with **no HIGH or CRITICAL severity vulnerabilities** before deployment. This check is a required step in the deployment pipeline and is not optional.

`npm audit` is run against the lockfile (`package-lock.json`) to ensure the audit reflects the exact versions being deployed, not the range specifications in `package.json`.

A deployment that contains unresolved HIGH or CRITICAL vulnerabilities is non-compliant and must not be promoted to production. MODERATE and LOW severity findings are documented but do not block deployment.

### 14.2 Security Patch SLA

When a HIGH or CRITICAL vulnerability is disclosed in a direct or transitive dependency used by AMG:

- The vulnerability must be assessed within **48 hours of disclosure**
- A patched version must be deployed within **7 days of the patch being available**
- If no patch is available within 7 days and the vulnerable code path is actively reachable in production, the affected functionality must be temporarily disabled until a patch is available

Vulnerability disclosure sources include: GitHub Security Advisories, `npm audit`, the National Vulnerability Database (NVD), and direct notifications from dependency maintainers.

### 14.3 Lockfile Policy

`package-lock.json` must be committed to the repository at all times. It must not be `.gitignore`d. The lockfile is the authoritative record of the exact dependency versions in use and is required for reproducible builds and accurate audit results.

`npm ci` (not `npm install`) is used in CI/CD pipelines to install dependencies. `npm ci` installs exclusively from the lockfile and fails if the lockfile is out of sync with `package.json`.

### 14.4 Abandoned Dependency Prohibition

Dependencies that have not received any maintenance activity (commits, releases, or issue responses) in the past **24 months** must not be introduced as new dependencies. Existing dependencies that enter an abandoned state must be assessed within 90 days and replaced if:
- No maintained fork exists
- The dependency handles security-sensitive operations (authentication, cryptography, input parsing, HTTP)
- The abandonment creates a meaningful supply-chain risk

### 14.5 Direct Dependency Preference

Direct, focused dependencies are preferred over large meta-framework bundles that bundle functionality the AMG system does not use. A dependency that provides one function but imports the entire library is treated as a bundle discipline violation (DOC-080 §6.4) as well as a supply-chain risk surface.

### 14.6 Supply-Chain Incident Classification

A supply-chain compromise — defined as the introduction of malicious code into a dependency used by AMG, whether through repository compromise, typosquatting, or dependency confusion — is treated as a **security incident** with the same severity as a direct breach of the AMG application.

Response to a supply-chain incident:
1. Immediately identify all AMG deployments using the compromised dependency version
2. Take affected deployments offline if the compromised code path is reachable
3. Deploy a clean build using a known-good dependency version
4. Conduct a post-incident review of how the compromised dependency entered the lockfile
5. Document the incident and resolution

Supply-chain incidents are logged as `SECURITY_EVENT` entries (DOC-090 §4.3) with `event: "SUPPLY_CHAIN_INCIDENT"`.

---

## 15. Production Error Response Discipline

### 15.1 Governing Principle

An error response that leaks internal system information is a reconnaissance asset for an attacker. Stack traces expose file paths, dependency names and versions, internal module structure, and query patterns. Internal paths reveal deployment layout. Environment variable values expose credentials. None of these belong in a client-facing HTTP response under any circumstances.

This section is not redundant with DOC-040 §3.3. DOC-040 defines the error envelope schema. This section defines what must never appear inside that envelope.

### 15.2 Prohibited Content in Production API Responses

The following must never appear in any HTTP response body returned by the AMG API in production:

**Stack traces:** The full or partial call stack of a thrown exception — including any string that contains file paths, line numbers, and function names in sequence — is prohibited. This applies regardless of error severity. A `400` validation error has the same prohibition as a `500` server error.

**Internal file paths:** Any path string of the form `/home/...`, `/var/...`, `/app/...`, `src/...`, `pages/...`, or similar that reveals the deployment's directory structure is prohibited. File paths appear in stack traces but may also appear in raw exception messages — both forms are prohibited.

**Environment variable values:** The value of any environment variable — including non-secret variables such as `NODE_ENV`, `NEXT_PUBLIC_SANITY_DATASET`, or `CANONICAL_DOMAIN` — must not appear in error response bodies. Environment variable names (not values) may appear in controlled developer-authored error messages only if operationally necessary, and only for non-secret variables.

**Dependency names and versions:** Raw exception messages from third-party libraries often include the library name and version. These must not be forwarded to the client.

**Database query content:** Sanity GROQ query strings, query parameters, or Sanity-returned error payloads must not be forwarded to the client.

### 15.3 Server Logs

Detailed exception information — stack traces, raw error messages, internal paths — belongs exclusively in server-side logs. DOC-090 §3.3 governs the controlled `errorMessage` pattern: the log entry's `errorMessage` field is a developer-authored string describing the failure context, not a raw exception message. The raw exception may be captured in `internalDetail` for server-side diagnostic use only.

### 15.4 Error Envelope Compliance

All production API error responses must use the governed error envelope defined in DOC-040 §3.3. The envelope's `message` field contains a controlled, human-readable string authored by the developer. It describes what went wrong at the user-action level ("The project could not be saved. Please try again.") without referencing internal implementation details.

The distinction is between describing a failure and explaining the failure's internal cause. The former is appropriate for client responses. The latter belongs only in server logs.

### 15.5 Implementation Requirement

Production error response discipline is enforced through a centralized error handler in the API layer. All unhandled exceptions are caught by this handler before reaching the HTTP response serializer. The handler:

1. Logs the full exception detail (stack trace, raw message) to server-side logging per DOC-090 §4.6
2. Constructs a governed error envelope using only the `errorCode` and a controlled `message` string
3. Returns the envelope with the appropriate HTTP status code

No route handler may bypass the centralized error handler by returning raw exception data directly.

---

*End of document.*
