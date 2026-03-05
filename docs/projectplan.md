# Feature 2: Slack/Discord Notifications + Unified Integrations

## Plan

Add Slack and Discord as first-class integrations alongside custom webhooks. Add a `type` field to the existing Webhook model (values: `custom`, `slack`, `discord`). Server formats rich messages (Slack blocks, Discord embeds) and posts directly to their APIs.

## Todo

- [x] Schema — Add `type` field to Webhook, make `secret` nullable, run `prisma db push`
- [x] Payload formatters — Add `formatSlackPayload` and `formatDiscordPayload`, branch `deliverWebhook` by type
- [x] Update webhook CRUD API — Accept `type`, conditional secret generation
- [x] Update test endpoint — Format test payload per type, skip signature for slack/discord
- [x] Update dashboard UI — Rename to "Integrations", add type picker, type-specific forms/badges
- [x] Write tests — Slack/Discord formatter tests, type-based signature behavior (37 tests pass)

## Key Decisions

- Reuse existing Webhook model with a `type` discriminator (no new models)
- Slack: Block Kit formatted messages with mrkdwn sections
- Discord: Embed JSON with indigo color (0x6366f1), inline fields, timestamp, Gotcha footer
- No HMAC signature for slack/discord (they don't need it)
- `secret` becomes nullable (only generated for custom type)

## Review

### Changes Made

**Database (1 file)**
- `prisma/schema.prisma` — Added `type String @default("custom")` to Webhook, changed `secret` to nullable

**Core Logic (1 file)**
- `lib/webhooks.ts` — Added `formatSlackPayload()` (Block Kit), `formatDiscordPayload()` (embeds), updated `deliverWebhook()` to branch by type (custom gets HMAC headers, slack/discord get formatted payloads)

**API Routes (2 files)**
- `app/api/projects/[slug]/webhooks/route.ts` — Accept `type` in create schema, conditional secret generation, return `type` in GET/POST
- `app/api/projects/[slug]/webhooks/[id]/test/route.ts` — Format test payload per type, skip signature for non-custom

**Dashboard UI (3 files)**
- `webhooks/page.tsx` — Title → "Integrations", added `type` to Prisma select
- `webhooks/webhook-manager.tsx` — Type picker step (Slack/Discord/Custom cards), type-specific URL placeholders, type badge on cards, secret banner only for custom, button text → "Add Integration"
- `projects/[slug]/page.tsx` — Button label → "Integrations"

**Tests (1 file)**
- `__tests__/api/webhooks.test.ts` — 19 new tests: Slack block structure, rating stars, vote emoji, content quote, element name; Discord embed structure, title, color, timestamp, fields, footer; type-based secret/signature behavior

### Summary
8 files modified, 0 new files. 37 tests pass, build succeeds.
