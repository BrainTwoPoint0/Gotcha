# Element Archiving — Audit Fixes

## Context

Three audits (security, senior code review, production readiness) identified issues in the element archiving feature. This plan addresses all findings.

## Todo

- [x] Atomic DB operations — replace read-then-write with `array_append`/`array_remove` raw SQL
- [x] Input validation — max 200 chars, allowlist regex, applied to both POST and DELETE
- [x] Array cap — reject archiving if >= 500 elements (enforced atomically in SQL WHERE clause)
- [x] Rate limiting — import `orgManagementLimiter` (20 req/hour per user)
- [x] Filter anomalies by archived element IDs in `analytics/page.tsx`
- [x] `router.refresh()` after successful archive/unarchive
- [x] Error feedback — inline alert with dismiss button
- [x] Archived element filter banner — show warning + "Clear filter" when `?elementId=` is archived
- [x] Deduplicate revert logic — extract `revertArchiveState()` helper
- [x] Fix TOCTOU race on cap — move cap check into SQL WHERE clause, check `rowsUpdated`
- [x] Update documentation (`feature-implementations.md`, `product-spec.md`)

## Audits

### Production Readiness — 5/5 PASS
All checks passed: build, error handling, client resilience, data consistency, rate limiter integration.

### Security — 7 PASS, 3 ADVISORY
- PASS: Input validation, authorization, rate limiting, SQL injection (parameterized tagged templates), race conditions (atomic SQL), XSS (React auto-escaping), error leakage
- ADVISORY (low risk): JSON parse errors return 500 instead of 400; rate limit key uses email (resets on email change); TOCTOU on cap (fixed)

### Senior Code Review — 6 PASS, 4 ADVISORY, 1 FAIL (fixed)
- PASS: Atomic SQL, input validation, rate limiting, authorization, optimistic UI + revert, archived filter banner, error state UX
- FAIL (fixed): TOCTOU race on 500-element cap — moved cap check into SQL WHERE clause
- ADVISORY: DELETE body portability, rapid double-click edge case, linear scan on archivedIds, overall averages include archived element data

## Files Changed

| File | Changes |
|------|---------|
| `app/api/elements/archive/route.ts` | Atomic SQL, validation, rate limiting, array cap (atomic) |
| `analytics/page.tsx` | Filter anomalies by archived IDs |
| `analytics/elements-tab.tsx` | router.refresh, error feedback, archived filter banner, dedup revert |
| `docs/feature-implementations.md` | Added Feature 9: Element Archiving |
| `docs/product-spec.md` | Added Element Archiving section to dashboard spec |
