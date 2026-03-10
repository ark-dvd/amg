# DOC-090 — AMG Observability, Logging & Operational Diagnostics

**Status:** Canonical
**Effective Date:** March 10, 2026
**Version:** 1.1
**Timestamp:** 20260310-1302 (CST)
**Governing Documents:** DOC-000 — AMG System Charter (v1.1); DOC-010 — Architecture (v1.1); DOC-040 — API Contract (v1.1); DOC-060 — Security (v1.2)

---

### Revision History

| Version | Timestamp (CST) | Changes |
|---------|-----------------|---------|
| 1.0 | 20260310-1020 | Initial release |
| 1.1 | 20260310-1302 | §7 Alert Threshold Governance added — five binding alert conditions with thresholds, required alert payload fields, alert routing policy, data suppression rules, and log schema alignment requirement |

---

### Document Standards

Canonical documents are written in English. All timestamps use Central Standard Time (CST).

---

## 1. Executive Intent

A production system that cannot be diagnosed is ungoverned. Logs are not a developer convenience. They are the evidence trail that makes the difference between a 5-minute incident resolution and a 4-hour archaeology expedition.

This document defines the structured logging schema, log severity taxonomy, log event catalog, and production debugging expectations for AMG. These requirements are binding. An admin API route that does not emit a structured mutation log is non-compliant. A security event that does not generate a log entry is invisible.

All log output is structured JSON. Free-form text log lines are not produced by application code.

---

## 2. Log Severity Taxonomy

| Level | Numeric | Usage |
|-------|---------|-------|
| `INFO` | 1 | Normal operational events. Successful mutations, routine requests. |
| `WARN` | 2 | Anomalous but non-fatal events. Rate limits, conflicts, read-back retries. |
| `ERROR` | 3 | Failures requiring attention. Write failures, unhandled exceptions. |
| `SECURITY_EVENT` | 4 | Security-relevant events. Auth failures, CSRF, origin rejections, honeypot. |

`SECURITY_EVENT` is a distinct type logged at `WARN` severity but tagged `type: "SECURITY_EVENT"` for routing and alerting.

---

## 3. Structured Log Schema

### 3.1 Base Fields

Every log entry must include all base fields:

```typescript
{
  level: "INFO" | "WARN" | "ERROR" | "SECURITY_EVENT",
  type: string,        // per §4 catalog
  requestId: string,   // UUID v4
  timestamp: string,   // ISO-8601 with milliseconds

  // Required for API route logs
  route: string,       // e.g. "/api/admin/projects/[id]"
  method: string,      // HTTP method
}
```

### 3.2 Prohibited Fields

The following must never appear in any log entry:

- Session tokens or OAuth access tokens
- `NEXTAUTH_SECRET` or any secret key value
- `SANITY_API_TOKEN` or any database credential
- Passwords
- Full HTTP request bodies
- Raw Sanity query strings
- Stack traces
- CSRF token values

### 3.3 Error Logging Discipline

`errorMessage` is a controlled developer-authored string — not a raw exception message from Sanity or Node.js. Raw exception messages may contain internal paths or query structures. If the original exception must be captured for debugging, it is stored in `internalDetail` and stripped from entries sent to external aggregators.

---

## 4. Log Event Catalog

### 4.1 Mutation Logs

Every admin mutation generates exactly one log entry at the conclusion of the mutation lifecycle.

**Log type:** `MUTATION`

Success:
```json
{
  "level": "INFO",
  "type": "MUTATION",
  "requestId": "uuid-v4",
  "route": "/api/admin/projects",
  "method": "POST",
  "entityType": "project",
  "entityId": "sanity-doc-id",
  "operation": "CREATE",
  "operatorEmail": "operator@example.com",
  "outcome": "SUCCESS",
  "durationMs": 187,
  "timestamp": "ISO-8601"
}
```

Failure:
```json
{
  "level": "ERROR",
  "type": "MUTATION",
  "requestId": "uuid-v4",
  "route": "/api/admin/projects/abc123",
  "method": "PUT",
  "entityType": "project",
  "entityId": "abc123",
  "operation": "UPDATE",
  "operatorEmail": "operator@example.com",
  "outcome": "FAILURE",
  "errorCode": "READBACK_FAILED",
  "mayHavePersisted": true,
  "durationMs": 2103,
  "timestamp": "ISO-8601"
}
```

**Required fields:**

| Field | Required | Notes |
|-------|----------|-------|
| `level` | Yes | `INFO` on success, `WARN` on conflict, `ERROR` on failure |
| `type` | Yes | `"MUTATION"` |
| `requestId` | Yes | UUID v4 |
| `route` | Yes | |
| `method` | Yes | |
| `entityType` | Yes | `"hero"`, `"about"`, `"service"`, `"project"`, `"testimonial"`, `"article"`, `"siteSettings"` |
| `entityId` | Yes | Sanity doc ID. `null` for CREATE before ID assigned. |
| `operation` | Yes | `"CREATE"`, `"UPDATE"`, `"DELETE"`, `"ARCHIVE"`, `"RESTORE"`, `"PUBLISH"`, `"UNPUBLISH"`, `"REORDER"`, `"FEATURED_TOGGLE"`, `"INITIALIZE"` |
| `operatorEmail` | Yes | From authenticated session. Never null on authenticated routes. |
| `outcome` | Yes | `"SUCCESS"` or `"FAILURE"` |
| `errorCode` | Conditional | Present on FAILURE only |
| `mayHavePersisted` | Conditional | `true` only when `errorCode === "READBACK_FAILED"` |
| `durationMs` | Yes | Total request duration |
| `timestamp` | Yes | ISO-8601 |

### 4.2 Read Logs

Admin GET requests are not individually logged unless anomalous:

| Event | Level |
|-------|-------|
| Singleton read returns `null` for expected entity | `WARN` |
| Read-back retry occurred during mutation | `WARN` |
| Admin GET returns `500 SERVER_ERROR` | `ERROR` |

**Log type:** `READ`

### 4.3 Security Event Logs

**Log type:** `SECURITY_EVENT`

```json
{
  "level": "WARN",
  "type": "SECURITY_EVENT",
  "requestId": "uuid-v4",
  "event": "CSRF_INVALID",
  "route": "/api/admin/projects",
  "method": "POST",
  "ip": "x.x.x.x",
  "userAgent": "[truncated to 200 chars]",
  "timestamp": "ISO-8601"
}
```

**Security Event Catalog:**

| `event` | Trigger | Level |
|---------|---------|-------|
| `AUTH_FAILED` | OAuth callback error | `WARN` |
| `WHITELIST_REJECTED` | Valid session, email not whitelisted | `WARN` |
| `UNAUTHORIZED` | Admin route without valid session | `WARN` |
| `CSRF_INVALID` | Missing or invalid CSRF token | `WARN` |
| `ORIGIN_REJECTED` | Request from unexpected origin | `WARN` |
| `HONEYPOT_TRIGGERED` | Contact form honeypot populated | `WARN` |
| `CAPTCHA_FAILED` | Contact form CAPTCHA failed | `WARN` |
| `UPLOAD_REJECTED` | Invalid MIME type or file size | `WARN` |
| `SUPPLY_CHAIN_INCIDENT` | Compromised dependency detected | `ERROR` |

### 4.4 Rate Limit Logs

**Log type:** `RATE_LIMITED`

```json
{
  "level": "WARN",
  "type": "RATE_LIMITED",
  "requestId": "uuid-v4",
  "route": "/api/public/contact",
  "method": "POST",
  "ip": "x.x.x.x",
  "limitCategory": "contact_per_ip",
  "timestamp": "ISO-8601"
}
```

`limitCategory` values: `"admin_per_session"`, `"auth_per_ip"`, `"contact_per_ip"`, `"contact_burst_per_ip"`, `"upload_per_session"`.

### 4.5 Contact Form Logs

**Log type:** `CONTACT_FORM`

| Scenario | Level | `outcome` |
|----------|-------|-----------|
| Successful delivery | `INFO` | `"DELIVERED"` |
| Honeypot triggered | `WARN` | `"HONEYPOT"` |
| CAPTCHA failed | `WARN` | `"CAPTCHA_FAILED"` |
| Duplicate fingerprint | `INFO` | `"DUPLICATE"` |
| Spam suspected | `WARN` | `"SPAM_SUSPECTED"` |
| Delivery failure | `ERROR` | `"DELIVERY_FAILED"` |

Contact form logs do not include name, email, phone, company, or message content.

### 4.6 Application Error Logs

**Log type:** `APP_ERROR`

```json
{
  "level": "ERROR",
  "type": "APP_ERROR",
  "requestId": "uuid-v4",
  "route": "/api/admin/articles/[id]/publish",
  "method": "PATCH",
  "errorCode": "SERVER_ERROR",
  "errorMessage": "Unexpected error during article publish operation",
  "timestamp": "ISO-8601"
}
```

---

## 5. requestId Lifecycle

`requestId` is UUID v4, generated at request start, present in every log entry for that request, and included in every API response envelope. Never reused.

When an operator reports an issue, the `requestId` from the failed operation provides a complete trace across all log entries for that request.

---

## 6. Production Debugging Expectations

### 6.1 What Logs Must Make Diagnosable

| Question | Answer Source |
|----------|--------------|
| Did this mutation succeed? | Mutation log `outcome` |
| When did it succeed? | Mutation log `timestamp` |
| Who performed it? | Mutation log `operatorEmail` |
| How long did it take? | Mutation log `durationMs` |
| Did write succeed but read-back fail? | Mutation log `mayHavePersisted: true` |
| Is this a concurrency conflict? | Mutation log `errorCode: "CONFLICT"` |
| Was this request rate-limited? | Rate limit log |
| Is someone making CSRF attacks? | Security event log |
| Did contact form delivery fail? | Contact form log `DELIVERY_FAILED` |
| Is the contact form being spammed? | Security event + rate limit + contact form logs |

### 6.2 Log Aggregation

AMG deployments emit structured JSON to stdout/stderr. The platform or aggregation service handles routing, storage, and alerting. Recommended: Logtail, Datadog, or equivalent.

### 6.3 Log Format and Output

All log output is NDJSON (one JSON object per line, no internal newlines). INFO and WARN to stdout. ERROR and SECURITY_EVENT to stderr.

### 6.4 Log Volume Discipline

Every log entry must provide operational value. Prohibited: logging every GET request in normal operation, per-field validation details, middleware pass-throughs. High-signal, low-noise governs.

---

## 7. Alert Threshold Governance

### 7.1 Purpose

Logging records what happened. Alerting triggers action when an anomaly pattern exceeds the threshold for normal variation. Alert thresholds are the difference between a system that silently degrades and a system that demands operator attention at the right moment.

Alert routing is deployment-specific. The application does not send alerts directly — it produces the log schema that alerting platforms (Datadog, Logtail, Netlify, or equivalent) consume to evaluate alert conditions. However, the alert conditions themselves are binding governance, not optional recommendations.

A deployment without configured alert thresholds is operationally ungoverned. All alert conditions in this section must be configured before a deployment is considered production-ready.

### 7.2 Binding Alert Conditions

The following five conditions must be configured as alerts in the production monitoring platform:

| # | Condition | Threshold | Window | Priority |
|---|-----------|-----------|--------|---------|
| A1 | `type: "APP_ERROR"` or `type: "MUTATION"` with `errorCode: "SERVER_ERROR"` | ≥ 5 events | 5 minutes | **HIGH** |
| A2 | `type: "MUTATION"` with `errorCode: "READBACK_FAILED"` | ≥ 3 events | 1 minute | **HIGH** |
| A3 | `type: "SECURITY_EVENT"` with `event: "AUTH_FAILED"` | ≥ 10 events | 1 minute | **HIGH** |
| A4 | `type: "RATE_LIMITED"` (any `limitCategory`) | ≥ 20 events | 5 minutes | **MEDIUM** |
| A5 | `type: "SECURITY_EVENT"` with `event: "CAPTCHA_FAILED"` | ≥ 3 events | 1 minute | **MEDIUM** |

These thresholds represent the minimum binding governance. Deployments may configure additional or tighter alert conditions as operational experience warrants.

### 7.3 Required Alert Payload Fields

Every alert notification must include the following fields derived from the triggering log entries:

```json
{
  "alertCondition": "A1",
  "triggerCount": 6,
  "windowMinutes": 5,
  "firstOccurrence": "ISO-8601",
  "lastOccurrence": "ISO-8601",
  "sampleRequestIds": ["uuid-1", "uuid-2", "uuid-3"],
  "route": "/api/admin/projects/[id]",
  "errorCode": "SERVER_ERROR"
}
```

**`sampleRequestIds`:** A minimum of 1 and maximum of 5 `requestId` values from events that triggered the alert. These enable direct log lookup for incident diagnosis.

**`route`:** The route most frequently associated with the triggering events. If the alert spans multiple routes, the most frequent is listed; the alert description references the log query for the full set.

### 7.4 Alert Data Suppression Rules

Alert payloads must comply with the same data suppression rules as log entries (§3.2):

- Alert payloads must never include: session tokens, OAuth tokens, API keys, CSRF tokens, passwords, full request bodies
- Alert payloads may include: `requestId`, `route`, `method`, `errorCode`, `ip` (for rate limit and security alerts), `timestamp`, event counts
- `operatorEmail` may be included in alerts for mutation error conditions (A1, A2) as it is necessary for diagnosis. It must not be included in security event alerts (A3, A5) or rate limit alerts (A4)

### 7.5 Alert Routing Policy

Alert routing — where notifications are sent (email, Slack, PagerDuty, SMS) — is determined per deployment. However:

- HIGH priority alerts (A1, A2, A3) must route to a channel that is monitored at all times when the production system is live
- MEDIUM priority alerts (A4, A5) may route to a monitored channel with lower urgency (e.g. a Slack channel checked daily)
- Alert notifications must not be routed exclusively to a channel or inbox that is never checked — unmonitored alerts provide no operational value

### 7.6 Log Schema Alignment Requirement

The log schema defined in §3 and §4 must be stable enough to support reliable alert queries. Alert conditions in §7.2 are defined against specific field names and values (`type`, `errorCode`, `event`). These field names and values are part of the governance contract. They must not be changed without a corresponding amendment to this document and a corresponding update to all configured alert queries.

A rename of `errorCode` to `error_code` in the log schema that is not reflected in alert query configurations will silently disable all alerts. Such a change constitutes a governance violation.

---

## 8. Compliance Checklist

| # | Requirement |
|---|-------------|
| 1 | Every admin mutation emits a MUTATION log entry |
| 2 | Mutation log includes `operatorEmail`, `entityType`, `entityId`, `operation`, `outcome`, `durationMs` |
| 3 | Failed mutations log `errorCode` and `mayHavePersisted` where applicable |
| 4 | Every CSRF failure emits a SECURITY_EVENT log |
| 5 | Every whitelist rejection emits a SECURITY_EVENT log |
| 6 | Every rate limit hit emits a RATE_LIMITED log |
| 7 | Every contact form outcome emits a CONTACT_FORM log |
| 8 | All log entries are structured JSON (NDJSON) |
| 9 | No secrets, tokens, or request bodies in any log entry |
| 10 | `requestId` in every log entry and in every API response envelope |
| 11 | Error log entries use controlled `errorMessage` strings |
| 12 | Alert condition A1 (≥5 SERVER_ERROR in 5 min) configured | 
| 13 | Alert condition A2 (≥3 READBACK_FAILED in 1 min) configured |
| 14 | Alert condition A3 (≥10 AUTH_FAILED in 1 min) configured |
| 15 | Alert condition A4 (≥20 RATE_LIMITED in 5 min) configured |
| 16 | Alert condition A5 (≥3 CAPTCHA_FAILED in 1 min) configured |
| 17 | All HIGH priority alerts route to actively monitored channel |
| 18 | Alert payloads include `sampleRequestIds` |
| 19 | Alert payloads comply with data suppression rules |

---

*End of document.*
