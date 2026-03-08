# Bug Activity Feed — Internal & External Notes

## Context

The bug detail page currently only allows a one-shot "message to reporter" on resolution. We want a proper activity feed where team members can add notes throughout the bug lifecycle. Notes are either **internal** (team only) or **external** (also emailed to the reporter).

## Todo

### 1. Add `BugNote` model to Prisma schema
- [x] New model: `id`, `bugTicketId`, `authorEmail`, `authorName`, `content`, `isExternal` (boolean), `createdAt`
- [x] Relation to `BugTicket` (cascade delete)
- [x] Index on `[bugTicketId, createdAt]`
- [x] Run `npx prisma generate`

### 2. Create API route for notes
- [x] `POST /api/bugs/[id]/notes` — create a note (internal or external)
- [x] `GET /api/bugs/[id]/notes` — fetch all notes for a bug
- [x] Pro-gated, org-scoped (same pattern as other bug routes)
- [x] If `isExternal: true` and reporter email exists, send notification email

### 3. Add email template for bug update notification
- [x] New `bugUpdateEmail()` template in `lib/emails/templates.ts`
- [x] New `sendBugUpdateEmail()` in `lib/emails/send.ts`
- [x] Distinct from resolution email — this is a status update/note

### 4. Add activity feed to bug detail page
- [x] Fetch notes in the server component alongside bug data
- [x] Render chronological activity feed in the main content area (below description, above resolution)
- [x] Internal notes: gray/neutral styling with "Internal" badge
- [x] External notes: blue tint with "Sent to reporter" badge
- [x] Also show status changes and resolution as system events in the feed

### 5. Add note composer to bug actions sidebar
- [x] Textarea + toggle for internal/external
- [x] External toggle only shown when `reporterEmail` exists
- [x] Submit button, clear after success
- [x] Refreshes page to show new note in feed

### 6. Fire `bug.updated` webhook event
- [x] New event when note is added (fires for both internal and external notes)
- [x] Also fires on status/priority changes
- [x] Add to VALID_EVENTS list + webhook manager UI
- [x] Slack/Discord formatters handle `bug.updated` with note content display

## Files

| File | Action |
|------|--------|
| `apps/web/prisma/schema.prisma` | Add `BugNote` model |
| `apps/web/app/api/bugs/[id]/notes/route.ts` | **New** — notes CRUD |
| `apps/web/lib/emails/templates.ts` | Add bug update template |
| `apps/web/lib/emails/send.ts` | Add `sendBugUpdateEmail()` |
| `apps/web/app/(dashboard)/dashboard/bugs/[id]/page.tsx` | Add activity feed |
| `apps/web/app/(dashboard)/dashboard/bugs/[id]/bug-actions.tsx` | Add note composer |

1 new file, 5 modified.

## Review

**Changes made:**
- **Prisma schema**: Added `BugNote` model with `bugTicketId`, `authorEmail`, `authorName`, `content`, `isExternal`, `createdAt`. Cascade deletes with BugTicket. Added `notes` relation to BugTicket.
- **Notes API** (`/api/bugs/[id]/notes`): GET returns all notes chronologically. POST creates a note, validates content (max 5000 chars), checks VIEWER role. External notes trigger email to reporter.
- **Email**: `bugUpdateEmail()` template (blue accent, distinct from green resolution email). `sendBugUpdateEmail()` send function.
- **Bug detail page**: Activity feed card between Original Response and Resolution sections. Internal notes show gray "Internal" badge, external notes show blue "Sent to reporter" badge. Each note shows author, timestamp, content.
- **Bug actions sidebar**: Split into 3 cards — Actions (status/priority), Add Note (textarea + "send to reporter" checkbox), Resolve (resolution note + reporter message). Note composer button changes label/style based on internal vs external.
