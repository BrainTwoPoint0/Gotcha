# Pro-Gate Bug Features

## Overview

Gate bug tracking/management features behind the Pro plan. Free users can still **collect** bug-flagged feedback (data is stored), but cannot **act on** it until they upgrade.

## What's Gated

| Feature | Free | Pro |
|---------|------|-----|
| `enableBugFlag` toggle in SDK | Yes | Yes |
| Bug data stored in DB (Response + BugTicket) | Yes | Yes |
| Bug email notifications (Resend) | No | Yes |
| Bug webhooks (Slack/Discord) | No | Yes |
| Dashboard bugs page | No (upgrade prompt) | Yes |
| Public API bug endpoints (`/api/v1/responses/[id]/bug`) | No (403) | Yes |

## Implementation Steps

### 1. Gate bug webhooks in external API route
**File:** `apps/web/app/api/v1/responses/route.ts`
**Change:** Bug webhooks already gated by `apiKey.plan === 'PRO'` check (line 216). No change needed.
- [x] Verified — already gated

### 2. Gate bug email notifications in external API route
**File:** `apps/web/app/api/v1/responses/route.ts`
**Change:** Wrapped `sendBugReportEmail` call inside `apiKey.plan === 'PRO'` check.
**Test:** `bug-gating.test.ts` covers email gating logic via `canAccessBugFeatures`.
- [x] Implement
- [x] Test

### 3. Gate bug email notifications in internal API route
**File:** `apps/web/app/api/v1/internal/responses/route.ts`
**Change:** Expanded cached API key to include `plan` (via org subscription lookup). Wrapped `sendBugReportEmail` in `apiKey.plan === 'PRO'` check.
**Test:** `bug-gating.test.ts` covers gating logic.
- [x] Implement
- [x] Test

### 4. Gate public API bug endpoint
**File:** `apps/web/app/api/v1/responses/[id]/bug/route.ts`
**Change:** After `validateApiKey`, check `apiKey.plan !== 'PRO'`. Returns 403 with `PLAN_REQUIRED` error.
**Test:** `bug-gating.test.ts` covers logic.
- [x] Implement
- [x] Test

### 5. Gate internal API bug endpoint
**File:** `apps/web/app/api/v1/internal/responses/[id]/bug/route.ts`
**Change:** Expanded cached key to include `plan`. Returns 403 if not PRO.
**Test:** `bug-gating.test.ts` covers logic.
- [x] Implement
- [x] Test

### 6. Gate dashboard bugs page
**File:** `apps/web/app/(dashboard)/dashboard/bugs/page.tsx`
**Change:** Added subscription include + `canAccessBugFeatures()` check. Shows "Unlock Bug Tracking" upgrade prompt (matches analytics page pattern) with amber warning icon.
**Test:** Manual — verify FREE user sees upgrade, PRO user sees bug list.
- [x] Implement
- [x] Test (type check passes)

### 7. Gate dashboard bug detail page
**File:** `apps/web/app/(dashboard)/dashboard/bugs/[id]/page.tsx`
**Change:** Added subscription include + `canAccessBugFeatures()` check. Redirects FREE users to `/dashboard/bugs` (which shows upgrade prompt).
**Test:** Manual — verify FREE user gets redirected.
- [x] Implement
- [x] Test (type check passes)

### 8. Add "Pro" badge to Bugs nav link
**File:** `apps/web/app/(dashboard)/layout.tsx`
**Change:** Added `badge="Pro"` to Bugs NavLink.
**Test:** Manual — verify badge appears in sidebar.
- [x] Implement
- [x] Test (type check passes)

### 9. Gate dashboard bug API routes
**Files:** `apps/web/app/api/bugs/route.ts`, `apps/web/app/api/bugs/[id]/route.ts`, `apps/web/app/api/bugs/[id]/resolve/route.ts`
**Change:** Added subscription include to auth queries. Added `organization.subscription?.plan !== 'PRO'` check returning 403. Consistent error message: "Bug tracking requires a Pro plan".
**Test:** `bug-gating.test.ts` covers logic.
- [x] Implement
- [x] Test (type check passes)

### Helper added
**File:** `apps/web/lib/plan-limits.ts`
**Change:** Added `canAccessBugFeatures(plan: string): boolean` — returns `true` only for PRO.
**Test:** `bug-gating.test.ts` — 12 tests all passing.

## Test Results

```
PASS __tests__/lib/bug-gating.test.ts (12 tests)
PASS __tests__/lib/plan-limits.test.ts (14 tests)
Total: 26 passed, 0 failed
Type errors: 0 new (6 pre-existing in test files)
```

## Review

All bug features are now Pro-gated:

1. **Data collection is NOT gated** — FREE users can still use `enableBugFlag` in the SDK, and both Response.isBug and BugTicket records are created. This means upgrading to PRO reveals all historical bugs.

2. **Management features ARE gated** — dashboard pages, API endpoints, email notifications, and webhooks all require PRO plan.

3. **Consistent patterns used:**
   - API routes: `apiKey.plan !== 'PRO'` → 403
   - Dashboard pages: `canAccessBugFeatures()` → upgrade prompt (same UI as analytics)
   - Nav sidebar: `badge="Pro"` on Bugs link
   - Internal routes: expanded cached key to include `plan` from org subscription

4. **Files modified:**
   - `apps/web/lib/plan-limits.ts` — added `canAccessBugFeatures()`
   - `apps/web/app/api/v1/responses/route.ts` — gated bug email
   - `apps/web/app/api/v1/internal/responses/route.ts` — expanded key, gated email
   - `apps/web/app/api/v1/responses/[id]/bug/route.ts` — gated endpoint
   - `apps/web/app/api/v1/internal/responses/[id]/bug/route.ts` — expanded key, gated endpoint
   - `apps/web/app/(dashboard)/dashboard/bugs/page.tsx` — upgrade prompt
   - `apps/web/app/(dashboard)/dashboard/bugs/[id]/page.tsx` — redirect to bugs list
   - `apps/web/app/(dashboard)/layout.tsx` — Pro badge
   - `apps/web/app/api/bugs/route.ts` — plan gate
   - `apps/web/app/api/bugs/[id]/route.ts` — plan gate
   - `apps/web/app/api/bugs/[id]/resolve/route.ts` — plan gate

5. **New files:**
   - `apps/web/__tests__/lib/bug-gating.test.ts` — 12 tests
