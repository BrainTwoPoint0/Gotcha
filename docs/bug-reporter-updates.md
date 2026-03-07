# Bug Reporter Updates

## Overview

Show who reported a bug and let admins send them a resolution update email.

## Steps

### 1. Add `reporterEmail`/`reporterName` to BugTicket schema
**File:** `apps/web/prisma/schema.prisma`
**Change:** Added two optional String fields to BugTicket model.
- [x] Implement
- [x] Test (db push + prisma generate)

### 2. Populate reporter fields at bug creation time
**Files:** 4 bug creation points
- `apps/web/app/api/v1/responses/route.ts` — from `data.user.email`/`data.user.name`
- `apps/web/app/api/v1/internal/responses/route.ts` — same
- `apps/web/app/api/v1/responses/[id]/bug/route.ts` — from `response.endUserMeta`
- `apps/web/app/api/v1/internal/responses/[id]/bug/route.ts` — same
- [x] Implement
- [x] Test (type check passes)

### 3. Show reporter info on bug detail page
**File:** `apps/web/app/(dashboard)/dashboard/bugs/[id]/page.tsx`
**Change:** Added Reporter card in sidebar (name, email, user ID). Removed duplicate user ID from Context card.
- [x] Implement
- [x] Test (type check passes)

### 4. Add "Message to reporter" field in bug actions
**File:** `apps/web/app/(dashboard)/dashboard/bugs/[id]/bug-actions.tsx`
**Change:** Added `reporterEmail` prop. When reporter has email, shows blue-tinted "Message to Reporter" textarea below internal note. Passes `reporterMessage` to resolve API. Renamed "Resolution Note" to "Internal Note" for clarity.
- [x] Implement
- [x] Test (type check passes)

### 5. Create bug resolution email template
**File:** `apps/web/lib/emails/templates.ts`
**Change:** Added `BugResolutionEmailProps` interface and `bugResolutionEmail()` template. Green-themed (`#ecfdf5` bg, `#10b981` border, `#065f46`/`#047857` text). Signs off as "The {projectName} Team" instead of "The Gotcha Team" — feels more personal.
- [x] Implement
- [x] Test (email-templates.test.ts passes)

### 6. Send resolution email from resolve API
**Files:** `apps/web/lib/emails/send.ts`, `apps/web/app/api/bugs/[id]/resolve/route.ts`
**Change:** Added `sendBugResolutionEmail()` function. Resolve endpoint now accepts `reporterMessage` in body. If `reporterMessage` + `bug.reporterEmail` exist, sends resolution email (non-blocking).
- [x] Implement
- [x] Test (type check passes)

## Review

All steps complete. The flow:

1. SDK user submits feedback with `enableBugFlag` + their `user.email`/`user.name`
2. Bug created with `reporterEmail`/`reporterName` extracted from user data
3. Admin sees Reporter card on bug detail page (name, email, user ID)
4. Admin resolves bug, writes internal note + optional message to reporter
5. If message provided + reporter has email → green-themed resolution email sent
6. Reporter receives "Issue Resolved" email with the admin's message
