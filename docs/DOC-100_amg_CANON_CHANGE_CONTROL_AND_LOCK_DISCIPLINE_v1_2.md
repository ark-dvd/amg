# DOC-100 — AMG Canon Change Control & Lock Discipline

**Status:** Canonical
**Effective Date:** March 10, 2026
**Version:** 1.2
**Timestamp:** 20260310-1435 (CST)
**Governing Document:** DOC-000 — AMG System Charter & Product Promise (v1.1)

---

### Revision History

| Version | Timestamp (CST) | Changes |
|---------|-----------------|---------|
| 1.0 | 20260310-1302 | Initial release |
| 1.1 | 20260310-1321 | §9 Canon Amendment Registry added |
| 1.2 | 20260310-1435 | §4.1 Amendment Identifier Naming Policy added — formal definition of CANON-HARDENING-[N] as pre-lock class and CANON-AMENDMENT-[N] as post-lock class, resolving identifier inconsistency; §9.2 registry rules updated to reference both identifier classes; §9.3 registry updated with HARDENING-008 and HARDENING-009; §8 inventory updated to current locked versions |

---

### Document Standards

Canonical documents are written in English. All timestamps use Central Standard Time (CST).

---

## 1. Executive Intent

Canonical documents define what AMG is. Without change control, they drift. Drift in governance documents produces drift in implementations. Implementations that deviate from canon are not AMG — they are undefined systems that happen to share a codebase.

This document defines when a canonical document is considered locked, what is required to change a locked document, who holds authority over changes, and how amendments are structured. These rules are not bureaucratic overhead. They are the mechanism by which the system remains what it was designed to be over time.

The discipline established here is intentional. AMG is a Maybach-grade production system. Maybach-grade systems do not evolve through undocumented ad hoc decisions. They evolve through explicit, traceable, rationale-driven amendments.

---

## 2. Canon Lock Definition

### 2.1 Lock Criteria

A canonical document is considered **locked** when all three of the following conditions are satisfied:

1. **Version ≥ 1.0** — The document has completed its initial audit and hardening cycle and carries a version number of 1.0 or greater.

2. **No unresolved audit findings** — All findings from any external CTO audit, internal review, or formal hardening round that apply to this document have been resolved. A finding is resolved when the document has been updated to address it and the addressing version has been approved.

3. **Cross-document references validated** — All references from this document to other canonical documents, and all references from other canonical documents to this document, have been reviewed for consistency. No cross-reference points to a section or rule that has been removed, renamed, or contradicted.

### 2.2 Current Lock Status

| Document | Version | Lock Status |
|----------|---------|-------------|
| DOC-000 — System Charter | 1.1 | **LOCKED** |
| DOC-010 — Architecture | 1.1 | **LOCKED** |
| DOC-020 — Data Model | 1.1 | **LOCKED** |
| DOC-030 — Back Office Model | 1.1 | **LOCKED** |
| DOC-040 — API Contract | 1.1 | **LOCKED** |
| DOC-050 — UX Interaction Contract | 1.2 | **LOCKED** |
| DOC-060 — Security Hardening | 1.5 | **LOCKED** |
| DOC-070 — SEO & Metadata | 1.2 | **LOCKED** |
| DOC-080 — Performance & Rendering | 1.3 | **LOCKED** |
| DOC-090 — Observability & Logging | 1.1 | **LOCKED** |
| DOC-100 — Change Control (this document) | 1.2 | **LOCKED** |

This table is updated with every amendment. It is the single authoritative record of what is locked and what is not.

---

## 3. Change Control Rules

### 3.1 No Direct Edits After Lock

Locked canonical documents cannot be modified directly. The document files as they exist at lock are the permanent record. To change a locked document, an amendment must be issued. The amendment document contains the proposed changes. When the amendment is approved, the affected document is updated to a new version incorporating the amendment.

### 3.2 What Requires an Amendment

An amendment is required for any change that affects the meaning, constraints, or behavioral requirements of a locked document. This includes:

- Adding a new rule or constraint
- Removing or relaxing an existing rule or constraint
- Changing a defined value (a rate limit threshold, a character limit, a timeout window)
- Resolving a contradiction between two documents by changing either one
- Adding, removing, or renaming a data field, API route, or error code
- Changing a compliance checklist item

**Does not require an amendment:**
- Correcting a typographical error that does not affect meaning
- Improving phrasing clarity without changing the rule
- Adding clarifying examples to an existing rule without changing the rule itself

Corrections that do not require amendments are documented in the revision history section of the affected document with the description "Minor correction — no behavioral change."

### 3.3 Cross-Document Impact Assessment

Every amendment must identify all documents affected by the proposed change. Changes frequently cascade. An amendment to DOC-020 (Data Model) that adds a new field may require corresponding amendments to DOC-040 (API Contract), DOC-030 (Back Office Model), and DOC-050 (UX Interaction Contract). All affected documents must be updated in the same amendment round — piecemeal changes that leave cross-references inconsistent are rejected.

---

## 4. Amendment Document Structure

Every amendment is a formal document. It is not a code comment, a chat message, or an informal decision. It is written, versioned, timestamped, and stored alongside the canonical documents.

### 4.1 Amendment Identifier Naming Policy

Two classes of amendment identifier are formally recognized:

**`CANON-HARDENING-[N]`** — Pre-lock amendment class. Used for all governance hardening rounds conducted before Canon Lock is declared. These rounds are initiated by an external CTO audit or Owner-directed governance tightening. They may span multiple documents and represent a cohesive governance correction pass rather than a single targeted change. All amendments issued against the AMG suite prior to Canon Lock carry this class prefix.

**`CANON-AMENDMENT-[N]`** — Post-lock amendment class. Used for all changes issued after Canon Lock has been formally declared (§10). Post-lock amendments are the governed mechanism for evolving the canon in response to implementation gaps, new requirements, or architectural decisions discovered during or after development.

Both classes share the same amendment document structure (§4.2), the same authority model (§5), and the same versioning discipline (§6). The prefix distinguishes when in the document lifecycle the amendment was issued — not the weight, scope, or authority required.

Sequential numbering within each class is independent. `CANON-HARDENING-009` and `CANON-AMENDMENT-001` are not related by their numeric suffixes. Identifiers within each class are sequential and never reused.

The Amendment Registry (§9.3) records both classes in a single chronological table. The `Amendment` column carries the full identifier including prefix, making the class visible at a glance.

### 4.2 Required Amendment Sections

```
# CANON-AMENDMENT-[N] — [Short Title]

Status: Proposed | Approved | Rejected
Version: [N]
Timestamp: [YYYYMMDD-HHMM CST]
Initiated By: [Who proposed the change]
Authority: [Who approved it]

## 1. Affected Documents

List every canonical document being modified by this amendment.

Example:
- DOC-020 — Canonical Data Model → v1.2
- DOC-040 — API Contract → v1.2

## 2. Change Rationale

Explain why this change is necessary. What problem does it solve?
What would happen if the change were not made?

This section must be substantive. "We need this feature" is not a rationale.
A rationale explains: what governance gap exists, why the current canon is
insufficient, and why this specific change is the correct resolution.

## 3. Proposed Changes

For each affected document, list the exact changes:

### DOC-020 §3.4 Project

Change: Add field `externalUrl` (string, optional, URL validated)
Reason: Operators need to link portfolio projects to live client sites.
Impact: No cascade — purely additive field, no constraints removed.

### DOC-040 §4.4 Projects

Change: Include `externalUrl` in PUT /api/admin/projects/[id] request body
Reason: New field must be settable via API.

## 4. Superseded Rules

List any rules from the current canon that this amendment supersedes.
If no rules are superseded (purely additive change), state: "None — additive only."

## 5. Cross-Document Validation

Confirm that all cross-references between affected documents remain consistent
after this amendment. List each cross-reference checked.

## 6. Compliance Impact

State whether the amendment changes any compliance checklist item in any
affected document. If yes, identify the item and the updated requirement.
```

### 4.3 Amendment Versioning

When an amendment is approved and applied:
- The affected document's minor version number increments (e.g. v1.1 → v1.2)
- The revision history section of the document records the amendment identifier and a concise change description
- The amendment document itself is retained as a permanent record
- The lock status table in DOC-100 §2.2 is updated

---

## 5. Authority Model

### 5.1 Owner Authority

The AMG system owner — referred to in this document as **Owner** — holds final authority over all canon changes. An amendment is not approved until the Owner explicitly approves it.

Owner approval is required for:
- Any change to DOC-000 (System Charter)
- Any change that adds, removes, or renames a public-facing URL or page
- Any change that reduces a security requirement
- Any change that removes a compliance checklist item
- Any change that relaxes a performance target or quality bar

### 5.2 Developer-Initiated Amendments

Developers and implementers may propose amendments. A proposed amendment is not valid until the Owner reviews and approves it.

The proposer writes the amendment document, identifies all affected documents, provides a rationale, and submits it for Owner review. The Owner may approve as-is, request modifications, or reject.

### 5.3 Rejection

A rejected amendment is documented with the reason for rejection. The rejection record is stored alongside other amendments. Rejected amendments may not be re-submitted without addressing the stated rejection reason.

### 5.4 Emergency Amendments

In the case of a critical production incident requiring an immediate governance change (e.g. a security vulnerability requiring an immediate rule modification), an emergency amendment may be declared with abbreviated documentation. Emergency amendments:
- Must still be documented — at minimum: amendment ID, affected document, change description, rationale, timestamp, operator email
- Must be reviewed and completed to full amendment format within 7 days of the emergency
- Are flagged with `Status: Emergency` in the amendment identifier line

Emergency amendments do not exempt any change from Owner approval. The Owner approves before the change is applied, even in an emergency.

---

## 6. Versioning Discipline

### 6.1 Version Number Structure

Canonical document version numbers follow `[major].[minor]` format:

- **Major version** (`1.x → 2.x`): Reserved for fundamental architectural changes that alter the nature of what the document governs. A change from single-user Back Office to multi-role access control system would be a major version change. Major version changes require a full re-audit of the affected document.

- **Minor version** (`x.1 → x.2`): Standard amendments that add or modify governance within the existing architecture. All changes to date have been minor versions.

### 6.2 Version Increment Rules

- Each approved amendment increments the minor version of each affected document
- A single amendment round affecting three documents increments each independently: DOC-020 v1.1 → v1.2, DOC-040 v1.1 → v1.2, DOC-050 v1.2 → v1.3
- Version numbers are never decremented
- Version numbers are never skipped

### 6.3 Revision History Completeness

The revision history section of every canonical document must be complete and accurate. Every version is represented with: version number, timestamp, and a concise change description. A document whose revision history does not account for all version numbers is non-compliant.

---

## 7. Implementation Drift Prevention

### 7.1 Canon as Implementation Reference

When an implementation decision contradicts the canon, the implementation is wrong — not the canon. There is no such thing as "the code says X therefore canon should say X." The canon says what the system must do. If the code does something different, the code is a defect.

### 7.2 Pre-Implementation Canon Review

Before any implementation phase begins, the relevant canonical documents must be reviewed to confirm they are locked and complete for the scope of that phase. Implementation must not begin against a document with unresolved audit findings.

### 7.3 Discovering Canon Gaps During Implementation

Implementation sometimes exposes canon gaps — situations the documents did not anticipate. When a gap is discovered:

1. Stop. Do not make an ad hoc implementation decision that implicitly changes the canon.
2. Document the gap as a proposed amendment.
3. Get Owner approval for the amendment.
4. Update the affected document(s).
5. Proceed with implementation against the updated canon.

An implementation decision made without resolving a canon gap through the amendment process is a governance violation. The gap must be resolved even if the implementation appears correct.

---

## 8. Canon Document Inventory

The complete set of canonical documents governing AMG at the time of canon lock:

| Document | Title | Version |
|----------|-------|---------|
| DOC-000 | System Charter & Product Promise | 1.1 |
| DOC-010 | Architecture & Responsibility Boundaries | 1.1 |
| DOC-020 | Canonical Data Model | 1.1 |
| DOC-030 | Back Office & Operational Model | 1.1 |
| DOC-040 | API Contract & Mutation Semantics | 1.1 |
| DOC-050 | Back Office UX Interaction Contract | 1.2 |
| DOC-060 | Security & Operational Hardening | 1.5 |
| DOC-070 | SEO, Indexability & Metadata Governance | 1.2 |
| DOC-080 | Performance, Rendering & Lighthouse Governance | 1.3 |
| DOC-090 | Observability, Logging & Operational Diagnostics | 1.1 |
| DOC-100 | Canon Change Control & Lock Discipline (this document) | 1.2 |

No document outside this inventory is canonical. Documents referenced in code, comments, or informal communications that are not in this inventory have no canonical standing.

---

## 9. Canon Amendment Registry

### 9.1 Purpose

The Amendment Registry is the authoritative, append-only log of every amendment ever issued against the AMG canonical document suite. Its purpose is to provide a single, unambiguous change history: what changed, when, and at what status.

The Registry complements the revision history sections within individual documents. Revision history in a document records what changed in that document. The Amendment Registry records that an amendment event occurred across the entire suite — including amendments that were proposed and rejected, which do not appear in any document's revision history.

### 9.2 Registry Rules

- The Registry is updated whenever an amendment is issued, regardless of outcome (Proposed, Approved, or Rejected)
- Amendment identifiers are never reused. Once a `CANON-HARDENING-N` or `CANON-AMENDMENT-N` identifier is assigned, it is permanently associated with that amendment event. A rejected or withdrawn amendment's identifier is retired, not reassigned
- The Registry is the canonical change history of the document suite. If a change occurred and it is not in this Registry, it was not a governed change
- The Registry is ordered chronologically by issue date, oldest first
- The `Documents Affected` column lists the DOC-NNN identifiers of all canonical documents modified by the amendment (empty for Rejected amendments)

### 9.3 Amendment Registry

| Amendment | Title | Status | Date (CST) | Documents Affected |
|-----------|-------|--------|------------|-------------------|
| CANON-HARDENING-001 | Initial document suite creation | Approved | 20260309 | DOC-000, DOC-010, DOC-020, DOC-030, DOC-040, DOC-050, DOC-060, DOC-070, DOC-080, DOC-090 |
| CANON-HARDENING-003 | CTO audit tightening round 1 | Approved | 20260310 | DOC-000, DOC-010, DOC-020, DOC-030, DOC-040, DOC-050, DOC-060, DOC-070 |
| CANON-HARDENING-005 | Final governance completion | Approved | 20260310 | DOC-060, DOC-070, DOC-080, DOC-090, DOC-100 |
| CANON-HARDENING-007 | Final governance tightening before Canon Lock | Approved | 20260310 | DOC-060, DOC-080, DOC-100 |
| CANON-HARDENING-008 | Final operational tightening before Canon Lock | Approved | 20260310 | DOC-060, DOC-080 |
| CANON-HARDENING-009 | Final consistency tightening before Canon Lock | Approved | 20260310 | DOC-060, DOC-100 |

### 9.4 How to Add an Entry

When an amendment is approved and applied, a new row is appended to §9.3 with:
- The amendment identifier (next sequential number not yet used)
- A short descriptive title (≤ 10 words)
- Status: `Approved`
- The CST date the amendment was applied (YYYYMMDD format)
- A comma-separated list of `DOC-NNN` identifiers for all modified documents

When an amendment is rejected, a row is still appended with:
- Status: `Rejected`
- `Documents Affected`: *(none)*

Rows are never removed or edited after being added.

---

## 10. Canon Lock Declaration

This section is completed by the Owner upon declaring canon lock.

```
Canon Lock Declaration
──────────────────────
All documents listed in §8 have been reviewed, audited, and amended 
to satisfaction. All cross-document references have been validated. 
No unresolved audit findings remain.

The AMG canonical document suite is hereby declared locked at the 
versions specified in §8.

Implementation may proceed.

Date: _______________
Owner: ______________
```

Until this section is completed, canon lock has not been formally declared.

---

*End of document.*
