# Feature 3: Response Tags UI

## Plan

Add UI for the existing tags API — display, inline editing, and filtering. Tags are PRO-only for editing, read-only for FREE users.

## Todo

- [x] Create `TagEditor` component — badge chips with "x" remove, "+" to add, optimistic PATCH calls, read-only for non-PRO
- [x] Add `TagEditor` to expanded response panel in `response-row.tsx` (with `isPro` prop)
- [x] Pass `isPro` from `page.tsx` to each `ResponseRow`
- [x] Add tag text input to filter bar, parse `tag` query param, add `tags: { has: tag }` to Prisma where
- [x] Verify tests — existing `response-status-tags.test.ts` already covers tag sanitization (30 tests pass)

## Key Decisions

- Reused existing `response-status-tags.test.ts` (already had 13 tag-specific tests) instead of creating a duplicate test file
- Tag filter uses Prisma `has` operator for exact tag matching on the string array field
- Optimistic UI with rollback on API error for smooth editing experience
- TagEditor renders nothing for FREE users with no tags (no empty state clutter)

## Review

### Changes Made

**New Component (1 file)**
- `responses/tag-editor.tsx` — Inline tag editor with badge chips, add/remove, PATCH to `/api/responses/[id]/tags`, optimistic updates, read-only mode for non-PRO

**Modified Files (3 files)**
- `responses/response-row.tsx` — Added `isPro` prop, imported and rendered `TagEditor` in expanded detail panel after metadata row
- `responses/page.tsx` — Pass `isPro` to `ResponseRow`, parse `tag` query param, add `tags: { has: tag }` to Prisma where clause
- `responses/responses-filter.tsx` — Added tag text input field, include `tag` in URL search params

### Verification
- `npm test` — 30 tests pass (response-status-tags)
- `tsc --noEmit` — no type errors in changed files
- Manual: expand response → see tag editor → add/remove tags
- Manual: filter by tag → correct responses shown
- Manual: FREE user → tags visible but not editable

---

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
- [x] Replace emoji icons with official Slack/Discord SVG brand marks + webhook SVG
- [x] Align pricing page with landing page design (Spotlight, BackgroundBeams, SpotlightCard, Button components, consistent padding)
- [x] Manual test — Slack integration verified working (Block Kit message with stars, content quote, element name)

## Key Decisions

- Reuse existing Webhook model with a `type` discriminator (no new models)
- Slack: Block Kit formatted messages with mrkdwn sections
- Discord: Embed JSON with indigo color (0x6366f1), inline fields, timestamp, Gotcha footer
- No HMAC signature for slack/discord (they don't need it)
- `secret` becomes nullable (only generated for custom type)
- Official brand SVGs for Slack (4-color) and Discord (blurple) icons

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
- `webhooks/webhook-manager.tsx` — Type picker with official Slack/Discord/Webhook SVG icons, type-specific URL placeholders, type badge with inline SVG on cards, secret banner only for custom
- `projects/[slug]/page.tsx` — Button label → "Integrations"

**Pricing Page Alignment (2 files)**
- `pricing/page.tsx` — Reused `CtaSection` (BackgroundBeams), `SpotlightCard` for program cards, consistent `py-20` padding, `text-3xl sm:text-4xl` headings, `bg-gray-800` code block
- `pricing/pricing-hero.tsx` — New component with `Spotlight` effect + gradient background matching landing page hero

**Tests (1 file)**
- `__tests__/api/webhooks.test.ts` — 19 new tests: Slack block structure, rating stars, vote emoji, content quote, element name; Discord embed structure, title, color, timestamp, fields, footer; type-based secret/signature behavior

### Verification
- `prisma db push` — success
- `npm test` — 37 tests pass
- `next build` — compiles successfully
- Manual: Slack test delivery confirmed working in #all-braintwopoint0 channel
