# Security & Production Audit Fixes

## Context

Security and production audits identified 31 findings across 16 security issues and 15 production issues. All addressed in a single pass across 18 source files.

## Todo

### Security
- [x] Cross-tenant idempotency leak — scope Redis keys by `apiKeyId`
- [x] Idempotency TOCTOU race — atomic `SET NX` claim
- [x] Internal bug route origin bypass — switch to `isInternalOriginAllowed`
- [x] Static CORS wildcard — remove from `netlify.toml`
- [x] API key state enumeration — unify error messages
- [x] SSRF IPv6 — block `fc00::/7`, `fe80::/10`, `::ffff:`
- [x] SQL injection — `$queryRawUnsafe` → tagged `$queryRaw`
- [x] RBAC — block VIEWER on key regen, require OWNER on project delete
- [x] Rate limiting — `orgManagementLimiter` on dashboard mutation routes
- [x] CSRF protection — `X-Requested-With` header on all mutation endpoints + client callers
- [x] Key prefix exposure — reduce stored prefix from 15 to 10 chars
- [x] Path param validation — UUID regex on response ID routes
- [x] Sensitive error logging — log `error.message` only, not full objects
- [x] X-XSS-Protection — change to `"0"` (deprecated header)
- [x] Dead code — remove unused `idempotencyCache` Ratelimit instance
- [x] Webhook secrets — add TODO for encryption at rest

### Production
- [x] asyncWrite swallows errors — remove inner try/catch, propagate to outer 500
- [x] JSON parse in Promise.all — move `request.json()` to own try/catch → 400
- [x] Usage warning emails — range-based thresholds for concurrency safety
- [x] GET parallelization — `count` + `findMany` in `Promise.all`
- [x] Health route error handling — return 503 instead of throwing
- [x] Keep-warm hardening — AbortController timeout, status check, `SITE_URL`
- [x] Null email safety — redirect in layout, safe access in dashboard page
- [x] User creation race — `create` → `upsert`
- [x] Dashboard query parallelization — projects + responses in `Promise.all`
- [x] Client error feedback — error state in bug-actions and webhook-manager
- [x] keyHash `@unique` — enables `findUnique` in api-auth
- [x] Corrupt idempotency cache — wrap `JSON.parse` in try/catch, fall through on failure
- [x] Internal bug route `findFirst` → `findUnique` on keyHash

### Schema
- [x] Add `@unique` to `keyHash` on `ApiKey` model
- [x] Remove redundant `@@index([keyHash])`
- [x] Create migration `20260316000000_add_keyhash_unique`

## Review

### Audits Passed
- **Tests**: 950/950 pass
- **TypeScript**: 0 source file errors (pre-existing test-only errors remain)
- **Senior code review**: No CRITICAL findings. 3 HIGH findings caught and fixed in second pass (missing CSRF headers on webhook toggle/delete and bug-actions, corrupt idempotency cache JSON.parse). Remaining advisories are accepted risks (DNS rebinding, fire-and-forget lastUsedAt, org creation race on first login).

### Files Changed (18 source + 3 test + 1 migration)

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | `keyHash @unique`, remove `@@index([keyHash])` |
| `lib/rate-limit.ts` | Atomic idempotency (SET NX), tenant-scoped keys, remove dead code |
| `lib/api-auth.ts` | `findUnique`, unified errors, null-origin comment, revokedAt post-check |
| `lib/webhooks.ts` | IPv6 SSRF blocking, DNS rebinding comment |
| `app/api/health/route.ts` | `$queryRaw`, try/catch → 503 |
| `app/api/v1/responses/route.ts` | JSON parse, asyncWrite propagation, usage ranges, GET parallel, idempotency cache safety |
| `app/api/v1/internal/.../bug/route.ts` | `isInternalOriginAllowed`, UUID check, `findUnique`, safe logging |
| `app/api/v1/responses/[id]/bug/route.ts` | UUID check, safe logging |
| `app/api/projects/[slug]/regenerate-key/route.ts` | RBAC, rate limit, CSRF, key prefix, safe logging |
| `app/api/projects/[slug]/route.ts` | RBAC (OWNER), rate limit, CSRF, safe logging |
| `app/api/projects/[slug]/webhooks/route.ts` | CSRF, webhook secret TODO, safe logging |
| `app/(dashboard)/layout.tsx` | Null email redirect |
| `app/(dashboard)/dashboard/page.tsx` | User upsert, email safety, parallel queries |
| `app/(dashboard)/dashboard/bugs/[id]/bug-actions.tsx` | Error state, res.ok checks, CSRF headers |
| `app/(dashboard)/.../webhook-manager.tsx` | Error state, CSRF headers on all mutations |
| `app/(dashboard)/.../api-key-card.tsx` | CSRF header |
| `app/(dashboard)/.../delete-project-card.tsx` | CSRF header |
| `netlify.toml` | Remove CORS wildcard, XSS header, CSP comment |
| `netlify/functions/keep-warm.ts` | Timeout, error handling, SITE_URL |
| `__tests__/api/api-auth-shape.test.ts` | Updated for findUnique + revokedAt |
| `__tests__/api/health.test.ts` | Updated for $queryRaw + 503 |
| `__tests__/api/responses-integration.test.ts` | Updated for error propagation (500) |
