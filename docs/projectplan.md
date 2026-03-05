# Feature: Webhooks/API for Responses

## Plan

PRO-only webhook system: fire events when responses are created, auto-disable after failures, dashboard UI for management.

## Todo

- [x] Add Webhook + WebhookLog models to Prisma schema + `prisma db push`
- [x] Create `apps/web/lib/webhooks.ts` — delivery logic with HMAC, timeout, logging, auto-disable
- [x] Integrate webhook firing into `POST /api/v1/responses` (PRO-only, non-blocking)
- [x] Create webhook CRUD API routes under `/api/projects/[slug]/webhooks/`
- [x] Create webhook dashboard UI (server page + client components)
- [x] Write unit tests for webhook logic

## Key Decisions

- HMAC-SHA256 signing with `X-Gotcha-Signature` header
- 10-second timeout per delivery
- Auto-disable after 10 consecutive failures
- Events: `response.created` (start simple, extensible later)
- Secret shown once on creation

## Review

### Changes Made

**Database (1 file modified)**
- `prisma/schema.prisma` — Added `Webhook` and `WebhookLog` models, added `webhooks` relation to `Project`

**Core Logic (2 files modified/created)**
- `lib/webhooks.ts` — `fireWebhooks()`, `generateSignature()`, `generateSecret()`, delivery with HMAC-SHA256, 10s timeout, parallel delivery, auto-disable after 10 consecutive failures
- `app/api/v1/responses/route.ts` — Added non-blocking webhook firing after response creation (PRO-only)

**API Routes (4 files created)**
- `app/api/projects/[slug]/webhooks/route.ts` — GET (list) + POST (create with secret)
- `app/api/projects/[slug]/webhooks/[id]/route.ts` — PATCH (update/toggle) + DELETE
- `app/api/projects/[slug]/webhooks/[id]/logs/route.ts` — GET (paginated delivery logs)
- `app/api/projects/[slug]/webhooks/[id]/test/route.ts` — POST (send test payload)

**Dashboard UI (3 files created)**
- `app/(dashboard)/dashboard/projects/[slug]/webhooks/page.tsx` — Server component, PRO gate
- `app/(dashboard)/dashboard/projects/[slug]/webhooks/webhook-manager.tsx` — Client component for CRUD
- `app/(dashboard)/dashboard/projects/[slug]/webhooks/webhook-logs.tsx` — Client component for delivery log table

**Tests (1 file created)**
- `__tests__/api/webhooks.test.ts` — 18 tests covering HMAC, secrets, payloads, failure counting, event filtering

### Webhook Headers Sent
- `X-Gotcha-Signature` — HMAC-SHA256 hex digest
- `X-Gotcha-Event` — Event name (e.g. `response.created`)
- `X-Gotcha-Timestamp` — Unix timestamp ms
- `Content-Type: application/json`
