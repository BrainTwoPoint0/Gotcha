# Gotcha — Project Plan

> **Phase:** 1 (Foundation MVP)
> **Goal:** Working SDK with feedback + vote modes, deployable API, basic dashboard
> **Reference:** [Product Spec](./product-spec.md)

---

## Overview

Build the Gotcha MVP as a Turborepo monorepo with:
- `packages/sdk` — React component library (npm package)
- `packages/shared` — Shared TypeScript types
- `apps/web` — Next.js dashboard + API

**MVP Scope:**
- 2 modes only: `feedback` and `vote`
- Domain allowlisting for API key security
- Anonymous user support
- Basic accessibility
- Upstash rate limiting
- Deploy to Netlify

---

## Todo List

### Week 1: Monorepo Setup + SDK Core

#### 1.1 Project Setup
- [x] Initialize Turborepo monorepo structure
- [x] Configure pnpm workspaces
- [x] Set up root `package.json` with scripts
- [x] Create `turbo.json` configuration
- [x] Set up ESLint + Prettier (shared config)
- [x] Set up TypeScript (shared tsconfig)

#### 1.2 Shared Package (`packages/shared`)
- [x] Create package structure
- [x] Define shared types (`ResponseMode`, `GotchaUser`, `GotchaResponse`, etc.)
- [x] Define API contract types (`SubmitResponsePayload`, `ApiError`)
- [x] Define constants (API URLs, error codes)

#### 1.3 SDK Package (`packages/sdk`)
- [x] Create package structure
- [x] Configure tsup for ESM + CJS builds
- [x] Implement `GotchaProvider` component
- [x] Implement `GotchaButton` component (with hover/touch behavior)
- [x] Implement `GotchaModal` component
- [x] Implement `FeedbackMode` component
- [x] Implement `VoteMode` component
- [x] Implement API client with retry logic
- [x] Add anonymous user ID generation
- [x] Add idempotency key generation
- [x] Add accessibility (ARIA, keyboard nav, focus trap)
- [x] Export types from `packages/shared`

#### 1.4 Local Testing
- [x] Create test Next.js app (can be in `apps/web` or separate)
- [x] Test SDK integration locally
- [x] Verify hover behavior on desktop
- [x] Verify touch behavior on mobile (via dev tools)

---

### Week 2: Backend + Database

#### 2.1 Next.js App Setup (`apps/web`)
- [x] Initialize Next.js 14 with App Router
- [x] Configure for Netlify deployment
- [x] Set up Tailwind CSS
- [ ] Install shadcn/ui base components

#### 2.2 Database Setup
- [x] Create Supabase project
- [x] Set up Prisma with schema from spec
- [x] Configure Prisma Accelerate for connection pooling
- [x] Run initial migration
- [ ] Create seed script for development

#### 2.3 Authentication
- [x] Set up Supabase Auth client utilities
- [x] Create auth middleware
- [x] Create login page
- [x] Create signup page
- [x] Create auth callback handler

#### 2.4 Rate Limiting
- [x] Create Upstash Redis project
- [x] Implement rate limiting middleware
- [x] Add rate limit headers to responses

#### 2.5 API Endpoints
- [x] Create API key validation middleware
- [x] Create domain allowlist validation
- [x] Implement `POST /api/v1/responses` (feedback + vote)
- [x] Implement `GET /api/v1/responses` (list with filters)
- [x] Implement `DELETE /api/v1/users/:userId` (GDPR)
- [x] Implement `GET /api/v1/users/:userId/export` (GDPR)
- [x] Add Zod request validation
- [x] Add idempotency handling

---

### Week 3: Vote Mode + Dashboard + Deployment

#### 3.1 SDK: Vote Mode
- [x] Implement `VoteMode` component (up/down buttons)
- [x] Add vote submission to API client
- [x] Test vote mode locally

#### 3.2 Dashboard: Core Layout
- [x] Create dashboard layout (sidebar + header)
- [x] Create project switcher component
- [x] Create navigation menu

#### 3.3 Dashboard: Project Management
- [x] Create project list page
- [x] Create project creation flow
- [x] Create project settings page

#### 3.4 Dashboard: API Key Management
- [x] Create API keys list UI
- [x] Create API key generation flow
- [x] Add domain allowlist configuration
- [x] Show/hide key functionality
- [x] Revoke key functionality

#### 3.5 Dashboard: Responses View
- [x] Create responses table (TanStack Table)
- [x] Add date range filter
- [x] Add mode filter
- [x] Add element filter
- [x] Add pagination
- [x] Create response detail view

#### 3.8 Stripe Integration (Pro Plan)
- [x] Install stripe package
- [x] Create Stripe client (`lib/stripe.ts`)
- [x] Create checkout session endpoint (`/api/stripe/checkout`)
- [x] Create webhook handler (`/api/stripe/webhook`)
- [x] Create customer portal endpoint (`/api/stripe/portal`)
- [x] Add plan upgrade/manage buttons to settings page

#### 3.9 AI/LLM Optimization
- [x] Create `llms.txt` file for AI crawlers
- [x] Add "Ask AI about Gotcha" section to footer
- [x] Add AI company logos (ChatGPT, Claude, Gemini, Perplexity, Grok)
- [x] Link logos to pre-populated prompts about Gotcha

#### 3.6 Deployment
- [x] Configure `netlify.toml`
- [x] Set up environment variables in Netlify
- [x] Deploy `apps/web` to Netlify
- [x] Verify API endpoints work in production
- [x] Publish SDK to npm (scoped: `gotcha-feedback`)

#### 3.7 Dogfooding
- [ ] Integrate SDK into PLAYBACK
- [ ] Add 2-3 G buttons to key features
- [ ] Verify feedback collection works end-to-end

---

## File Structure (Target)

```
gotcha/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   ├── signup/page.tsx
│       │   │   └── callback/route.ts
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   └── projects/[slug]/
│       │   │       ├── page.tsx
│       │   │       ├── responses/page.tsx
│       │   │       ├── api-keys/page.tsx
│       │   │       └── settings/page.tsx
│       │   └── api/v1/
│       │       ├── responses/route.ts
│       │       └── users/[userId]/
│       │           ├── route.ts
│       │           └── export/route.ts
│       ├── components/
│       ├── lib/
│       │   ├── prisma.ts
│       │   ├── supabase/
│       │   └── rate-limit.ts
│       ├── prisma/schema.prisma
│       └── netlify.toml
├── packages/
│   ├── sdk/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── tsup.config.ts
│   └── shared/
│       ├── src/
│       │   ├── types.ts
│       │   └── constants.ts
│       └── package.json
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Environment Variables

### Development (`.env.local`)
```env
DATABASE_URL=
DIRECT_DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Production (Netlify)
Same as above, plus:
```env
NEXT_PUBLIC_APP_URL=https://app.gotcha.cx
```
Note: For production, create a new webhook in Stripe Dashboard pointing to `https://gotcha.cx/api/stripe/webhook` and use that webhook secret.

---

## Dependencies (Key Packages)

### `packages/sdk`
- react, react-dom (peer)
- framer-motion (animations)
- tsup (build)

### `apps/web`
- next
- @prisma/client, prisma
- @supabase/ssr, @supabase/supabase-js
- @upstash/redis, @upstash/ratelimit
- zod
- @tanstack/react-table
- tailwindcss
- shadcn/ui components

---

## Success Criteria (Phase 1 Complete)

- [x] SDK installable via npm (`gotcha-feedback`)
- [x] Feedback mode works end-to-end
- [x] Vote mode works end-to-end
- [x] Dashboard shows responses
- [x] API keys can be created with domain allowlist
- [x] Rate limiting works
- [x] Deployed to Netlify (gotcha.cx)
- [ ] Integrated into PLAYBACK for dogfooding

---

## Notes

- Keep changes minimal and simple per CLAUDE.md guidelines
- Focus on feedback + vote only; poll/ab/feature-request come in Phase 2
- Stripe billing added (Pro plan at $29/month)
- No real-time updates in Phase 1 (polling is fine for MVP)

---

## Review

### Week 1 Completion Summary

**Completed:**
- Full monorepo setup with Turborepo + pnpm workspaces
- Shared package with TypeScript types and constants
- SDK package with:
  - `GotchaProvider` - Context provider with single-modal management
  - `Gotcha` - Main component with feedback and vote modes
  - `GotchaButton` - Animated button with framer-motion (enter/exit animations)
  - `GotchaModal` - Smart positioning (auto-detects if should appear above/below)
  - `FeedbackMode` - Star rating + text input
  - `VoteMode` - Thumbs up/down
  - API client with exponential backoff retry logic
  - Anonymous user ID generation (localStorage)
  - Idempotency key generation
  - Full accessibility (ARIA labels, focus trap, keyboard navigation)
- Test app in `apps/web` demonstrating all variants

**Additional Features Added:**
- Framer-motion animations for smooth button/modal transitions
- Single modal enforcement (only one modal open at a time)
- Smart modal positioning (appears above button if not enough space below)
- Inline position option for placing G button next to text

**Dependencies Added:**
- `framer-motion` for animations

**Ready for Week 2:** Backend setup with Supabase, Prisma, and API endpoints

### Week 2 Progress Summary

**Completed:**
- Backend dependencies installed (Prisma, Supabase SSR, Upstash, Zod)
- Full Prisma schema created with:
  - Organization & User models
  - Project & ApiKey models (with domain allowlisting)
  - Element & Response models (supporting all 5 modes)
  - Experiment model for A/B testing
  - Subscription model for billing
- Supabase client utilities (server + browser)
- Auth middleware for protected routes
- Rate limiting middleware with Upstash Redis (per-plan limits)
- API key validation with domain allowlist checking
- Core API endpoints:
  - `POST /api/v1/responses` - Submit feedback/vote with idempotency
  - `GET /api/v1/responses` - List responses with filtering
  - `DELETE /api/v1/users/:userId` - GDPR data deletion
  - `GET /api/v1/users/:userId/export` - GDPR data export
- Zod request validation for all endpoints
- Netlify configuration for deployment

**Files Created:**
- `prisma/schema.prisma` - Full database schema
- `lib/prisma.ts` - Prisma client singleton
- `lib/supabase/server.ts` - Supabase server client
- `lib/supabase/client.ts` - Supabase browser client
- `lib/rate-limit.ts` - Rate limiting with Upstash
- `lib/api-auth.ts` - API key validation middleware
- `lib/validations.ts` - Zod schemas
- `middleware.ts` - Auth middleware
- `netlify.toml` - Netlify deployment config
- `app/api/v1/responses/route.ts` - Responses endpoint
- `app/api/v1/users/[userId]/route.ts` - User deletion
- `app/api/v1/users/[userId]/export/route.ts` - User export

**Remaining for Week 2:**
- Create Supabase project and run migrations
- Create Upstash Redis project
- Create auth pages (login, signup, callback)
- Install shadcn/ui components

**Ready for Week 3:** Dashboard UI and deployment

### Week 3+ Progress Summary (MVP Launch Prep)

**Dashboard & Auth Completed:**
- Full dashboard layout with sidebar navigation
- Project list and detail pages
- API key management with copy/reveal functionality
- Response viewing with filtering
- Login/Signup pages with GitHub OAuth (Google removed for simplicity)
- Auth callback handler
- Signout functionality with proper redirects to gotcha.cx

**Settings Page:**
- Profile editing (name - email is read-only)
- Organization editing (name, slug) with validation
- Subscription section showing actual usage from database:
  - Responses this month (counted from DB)
  - Total responses (all time)
  - Plan limits and progress bar
- Simplified plan cards: Free (500/month) and Pro ($29/month unlimited)

**Marketing Site:**
- Homepage with hero section and npm install code box
- Pricing page with 2 tiers: Free and Pro
- Removed testimonials section (not yet launched)
- Shared Footer component
- Special Programs section with Contact Us links

**API Improvements:**
- Fixed API key `lastUsedAt` not updating (was fire-and-forget, now awaited)
- Added `force-dynamic` to pages to prevent stale data

**Auth Flow Improvements:**
- Disabled email confirmation - users go directly to dashboard
- Fixed OAuth redirect to gotcha.cx (was going to Netlify URL)
- Fixed signout redirect using `headers().get('host')` instead of `request.url`
- Removed Google OAuth, kept GitHub only

**New Files Created:**
- `app/(dashboard)/dashboard/settings/settings-forms.tsx` - Client forms for profile/org editing
- `app/api/user/profile/route.ts` - PATCH endpoint for user name
- `app/api/organization/route.ts` - PATCH endpoint for org name/slug
- `app/components/Footer.tsx` - Shared footer component

**Deployment:**
- Deployed to Netlify
- Domain configured: gotcha.cx
- Supabase Auth Site URL set to gotcha.cx

### Video Project (apps/video)

**Launch Announcement Video:**
- Created Remotion video project for SDK launch
- Scenes: Intro, Install Package, Wrap Provider, View Dashboard, CTA
- Animations: Typewriter effects, spring animations, code highlighting
- Final CTA with npm command and slogan "Turn insights into action."
- Fixed typewriter flickering with frame-based check
- Custom highlight delays for code editor lines

### Stripe Integration & Responses Page Updates

**Date Range Filter & Pagination (Responses Page):**
- Created `responses-filter.tsx` - Client component with start/end date inputs
- Created `pagination.tsx` - Client component with Previous/Next buttons
- Updated `responses/page.tsx` to support URL-based filtering and pagination
- 20 responses per page, filters persist across navigation

**Stripe Integration:**
- Installed `stripe` package
- Created `lib/stripe.ts` with Stripe client initialization
- Created `/api/stripe/checkout/route.ts`:
  - Creates Stripe customer if needed (stores `stripeCustomerId`)
  - Creates checkout session with organization metadata
  - Returns checkout URL for redirect
- Created `/api/stripe/webhook/route.ts`:
  - Handles `checkout.session.completed` - updates subscription to PRO
  - Handles `customer.subscription.updated` - syncs status
  - Handles `customer.subscription.deleted` - reverts to FREE
  - Uses `upsert` for reliability (handles missing records)
- Created `/api/stripe/portal/route.ts` for subscription management
- Created `plan-actions.tsx` - Upgrade/Manage buttons on settings page

**Files Created:**
- `apps/web/app/(dashboard)/dashboard/responses/responses-filter.tsx`
- `apps/web/app/(dashboard)/dashboard/responses/pagination.tsx`
- `apps/web/lib/stripe.ts`
- `apps/web/app/api/stripe/checkout/route.ts`
- `apps/web/app/api/stripe/webhook/route.ts`
- `apps/web/app/api/stripe/portal/route.ts`
- `apps/web/app/(dashboard)/dashboard/settings/plan-actions.tsx`

**Files Modified:**
- `apps/web/app/(dashboard)/dashboard/responses/page.tsx` - Added filtering & pagination
- `apps/web/app/(dashboard)/dashboard/settings/page.tsx` - Added PlanActions component

**Environment Variables Required:**
```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

**Testing Notes:**
- Use Stripe CLI for local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Test cards: 4242 4242 4242 4242 (success), 4000 0000 0000 0002 (decline)
- Payment flow tested and working

### AI/LLM Optimization

**Goal:** Make Gotcha discoverable and recommendable by AI assistants (ChatGPT, Claude, etc.)

**Implementation:**

1. **`/public/llms.txt`** - Standard format file for AI crawlers containing:
   - Product description and tagline
   - Quick start code examples
   - Feature list and props documentation
   - Pricing information
   - Use cases and benefits
   - Contact information

2. **Footer "Ask AI about Gotcha" Section:**
   - Added row of AI company logos to marketing site footer
   - Icons: ChatGPT, Claude, Gemini, Perplexity, Grok
   - Each icon links to respective AI with pre-populated prompt asking about Gotcha
   - Hover effect: gray → white transition
   - Responsive sizing for visual balance

**Files Created/Modified:**
- `apps/web/public/llms.txt` - AI-readable product documentation
- `apps/web/app/components/Footer.tsx` - Added AI links section with SVG icons

**How It Works:**
- Users can click any AI logo to open that AI's chat with a prompt about Gotcha
- The `llms.txt` file helps AI crawlers understand the product for accurate recommendations
- Both approaches increase product visibility in AI-assisted developer workflows

### Testing Infrastructure & TDD

**Test Setup Completed:**
- Jest + React Testing Library for unit tests
- Playwright for E2E tests
- Test scripts added to `package.json`

**Test Coverage (92 tests total):**

| Category | Framework | Tests | Coverage |
|----------|-----------|-------|----------|
| Validation Schemas | Jest | 37 | All modes (feedback, vote, poll, feature-request, A/B) |
| Plan Limits | Jest | 6 | FREE, PRO |
| API Logic | Jest | 20 | Mode mapping, poll calculations, query validation |
| Auth Pages | Playwright | 12 | Login, Signup, password validation, protected routes |
| Marketing Pages | Playwright | 9 | Homepage, Pricing, Demo |
| API Endpoints | Playwright | 8 | Auth errors, CORS, demo submission |

**Test Commands:**
```bash
npm test              # Run Jest unit tests
npm run test:watch    # Jest in watch mode
npm run test:coverage # Jest with coverage report
npm run test:e2e      # Run Playwright E2E tests
npm run test:e2e:ui   # Playwright with visual UI
```

**Files Created:**
- `jest.config.js` - Jest configuration with Next.js support
- `jest.setup.js` - Test setup with mocks for next/navigation
- `playwright.config.ts` - Playwright configuration (Chromium, Firefox, WebKit, Mobile)
- `__tests__/lib/validations.test.ts` - Validation schema tests
- `__tests__/lib/plan-limits.test.ts` - Plan limit tests
- `__tests__/api/responses.test.ts` - API logic tests
- `e2e/auth.spec.ts` - Authentication E2E tests
- `e2e/marketing.spec.ts` - Marketing pages E2E tests
- `e2e/api.spec.ts` - API endpoint E2E tests

**Updated `.gitignore`:**
- Added `test-results/`, `playwright-report/`, `coverage/` to prevent test artifacts from being committed

---

## TDD Guidelines

All new development should follow Test-Driven Development principles:

### 1. Write Tests First
Before implementing any new feature or fixing a bug:
1. Write a failing test that describes the expected behavior
2. Run the test to confirm it fails
3. Implement the minimum code to make the test pass
4. Refactor while keeping tests green

### 2. Test Categories

**Unit Tests (Jest)** - Use for:
- Validation logic (Zod schemas)
- Utility functions
- Data transformations
- Business logic that doesn't require HTTP

**E2E Tests (Playwright)** - Use for:
- User flows (signup, login, dashboard navigation)
- API endpoint integration
- Cross-page interactions
- Visual regression (if needed)

### 3. Test File Naming
- Unit tests: `__tests__/<category>/<name>.test.ts`
- E2E tests: `e2e/<feature>.spec.ts`

### 4. Test Structure
```typescript
describe('Feature Name', () => {
  describe('Scenario', () => {
    it('should do expected behavior', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### 5. Before Merging
- All tests must pass: `npm test && npm run test:e2e`
- New features must have corresponding tests
- Bug fixes should include regression tests

---

### Recent Fixes & Updates

**GitHub OAuth Fix:**
- Fixed redirect loop where OAuth was going to `/login?code=...` instead of `/auth/callback`
- Root cause: `NEXT_PUBLIC_SITE_URL` was being used on localhost, redirecting to production
- Solution: Use `window.location.origin` for localhost, `NEXT_PUBLIC_SITE_URL` for production
- Files modified: `login/page.tsx`, `signup/page.tsx`

**Auth Callback User Creation:**
- Updated `/auth/callback/route.ts` to create Prisma user after OAuth
- Creates user record with email, name, avatar from GitHub metadata
- Creates default organization with FREE subscription
- Properly handles cookies for session persistence

**Plan Simplification:**
- Removed STARTER and ENTERPRISE plans from application code
- Only two plans now: FREE (500/month) and PRO (unlimited)
- Updated `getPlanLimit()` functions in dashboard
- Note: Prisma enum still has all values (no migration needed)

**pnpm to npm Migration:**
- Removed `pnpm-lock.yaml` and `pnpm-workspace.yaml`
- Removed `packageManager` field from root `package.json`
- Fixed Prisma client generation path issues on Netlify
- Build now uses npm directly

---

## Phase 2: Pro Features - Analytics & Export

### Overview

Add two Pro-exclusive features to the dashboard:
1. **Analytics Dashboard** - Charts showing response trends, sentiment breakdown, ratings over time
2. **Export Functionality** - CSV/JSON export with date range selection

### Todo List

#### 1. Analytics Dashboard

- [x] Install recharts (lightweight React charting library)
- [x] Create `/dashboard/analytics/page.tsx` - Analytics page (Pro only)
- [x] Add "Analytics" nav item to dashboard layout (with Pro badge)
- [x] Implement response trends chart (daily responses over last 30 days)
- [x] Implement sentiment breakdown (pie chart: upvotes vs downvotes)
- [x] Implement average rating chart (line chart over time)
- [x] Implement mode distribution chart (bar chart: feedback vs vote counts)
- [x] Add Pro gate - redirect FREE users to upgrade page

#### 2. Export Functionality

- [x] Create `/api/export/responses/route.ts` - Export API endpoint
- [x] Add export button to responses page (Pro only)
- [x] Support CSV format export
- [x] Support JSON format export
- [x] Use existing date filters for export range
- [x] Add Pro gate on API endpoint

### Implementation Details

#### New Files
- `apps/web/app/(dashboard)/dashboard/analytics/page.tsx` - Analytics page
- `apps/web/app/(dashboard)/dashboard/analytics/charts.tsx` - Client-side chart components
- `apps/web/app/api/export/responses/route.ts` - Export API

#### Modified Files
- `apps/web/app/(dashboard)/layout.tsx` - Add Analytics nav link
- `apps/web/app/(dashboard)/dashboard/responses/page.tsx` - Add export button
- `apps/web/package.json` - Add recharts dependency

#### Chart Library
Using `recharts` - lightweight, React-native, good TypeScript support

#### Pro Gating
- Check subscription plan in server components
- FREE users see "Upgrade to Pro" prompt instead of analytics/export

### Phase 2 Implementation Summary

**Analytics Dashboard (`/dashboard/analytics`):**
- Pro-only page with upgrade prompt for FREE users
- Summary stats: Total responses, Avg rating, Positive rate, Most common type
- Response trends line chart (last 30 days)
- Response types horizontal bar chart (color-coded by mode)
- Vote sentiment pie chart (positive vs negative)
- Average rating over time line chart

**Export Functionality:**
- Export button on responses page (top right)
- Pro users see dropdown with CSV/JSON options
- FREE users see grayed button linking to upgrade
- Respects existing date filters from URL params
- Downloads file with date-stamped filename

**Files Created:**
- `app/(dashboard)/dashboard/analytics/page.tsx` - Analytics page with Pro gate
- `app/(dashboard)/dashboard/analytics/charts.tsx` - Recharts client components
- `app/(dashboard)/dashboard/responses/export-button.tsx` - Export button component
- `app/api/export/responses/route.ts` - Export API with Pro gate

**Files Modified:**
- `app/(dashboard)/layout.tsx` - Added Analytics nav with Pro badge, ChartIcon
- `app/(dashboard)/dashboard/responses/page.tsx` - Added export button, subscription query

**Dependencies Added:**
- `recharts` - React charting library

---

### ESLint + Prettier Setup

**Installed Packages:**
- `eslint@^8.57.0` - ESLint (v8 for Next.js 14 compatibility)
- `eslint-config-next@14.2.10` - Next.js ESLint rules
- `eslint-config-prettier` - Disables ESLint rules that conflict with Prettier
- `prettier` - Code formatter

**Configuration Files Created:**
- `.eslintrc.json` - Extends `next/core-web-vitals` and `prettier`
- `.prettierrc` - Consistent formatting (single quotes, 2 spaces, trailing commas)
- `.prettierignore` - Excludes build outputs and generated files

**Scripts Added:**
- `npm run lint` - Check for ESLint errors
- `npm run lint:fix` - Auto-fix ESLint errors
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files are formatted

**Formatting Applied:**
- Ran `npm run format` to fix 42 files
- All 63 existing tests still pass

---

### Resend Email Notifications

**Goal:** Add transactional email notifications using Resend.

**Implementation:**

1. **`lib/resend.ts`** - Resend client initialization
   - Exports `resend` client and `FROM_EMAIL` constant
   - Sender: `Gotcha <info@braintwopoint0.com>`

2. **`lib/emails/templates.ts`** - HTML email templates
   - `welcomeEmail()` - Getting started guide for new users
   - `proActivatedEmail()` - Pro upgrade confirmation
   - `usageWarningEmail()` - Approaching 500 limit warning
   - `responseAlertEmail()` - New feedback received notification

3. **`lib/emails/send.ts`** - Helper functions
   - `sendWelcomeEmail(user)` - Sends directly to user email
   - `sendProActivatedEmail(orgId)` - Fetches org owner email
   - `sendUsageWarningEmail(orgId, current, limit)` - At 80% threshold
   - `sendResponseAlertEmail(orgId, response)` - On new response

**Email Triggers:**

| Email | Location | Trigger |
|-------|----------|---------|
| Welcome | `/app/auth/callback/route.ts` | After new user + org creation |
| Pro Activated | `/app/api/stripe/webhook/route.ts` | After `checkout.session.completed` |
| Usage Warning | `/app/api/v1/responses/route.ts` | At 400, 450, 500 responses |
| Response Alert | `/app/api/v1/responses/route.ts` | Every new response |

**Files Created:**
- `apps/web/lib/resend.ts`
- `apps/web/lib/emails/templates.ts`
- `apps/web/lib/emails/send.ts`

**Files Modified:**
- `apps/web/app/auth/callback/route.ts` - Added welcome email
- `apps/web/app/api/stripe/webhook/route.ts` - Added Pro activation email
- `apps/web/app/api/v1/responses/route.ts` - Added usage warning + response alerts

**Dependencies Added:**
- `resend` - Email sending service

**Environment Variables Required:**
```
RESEND_API_KEY=re_xxxxx
```

**Notes:**
- All emails are fire-and-forget (don't block request)
- Domain `braintwopoint0.com` must be verified in Resend dashboard
- Usage warnings only sent at specific thresholds (400, 450, 500) to avoid spam

---

### LLM Discoverability Optimization

**Goal:** Improve Gotcha's visibility in AI assistants (ChatGPT, Claude, Gemini, etc.)

**Implementation:**

1. **Enhanced llms.txt** (`/public/llms.txt`)
   - Added npm install command in summary blockquote
   - Added error handling documentation with error codes
   - Added "Why Gotcha vs Generic Surveys?" comparison table
   - Added API endpoints reference
   - Added `## Optional` section per spec

2. **New llms-full.txt** (`/public/llms-full.txt`)
   - Comprehensive 300+ line documentation
   - Table of contents with 11 sections
   - Full component API reference
   - Code examples for all use cases
   - FAQ section with common questions
   - Comparison tables vs Hotjar, Typeform, custom solutions

3. **JSON-LD Structured Data** (`/app/(marketing)/layout.tsx`)
   - `SoftwareApplication` schema with features, pricing, download URL
   - `FAQPage` schema with 4 common questions
   - `Organization` schema with contact info
   - Added to all marketing pages

4. **Updated AI Prompts** (`/app/components/Footer.tsx`)
   - Added npm package name and URL to prompt
   - Added "gotcha-feedback" package mention
   - Added comparison framing ("instead of generic survey tools")

**Files Created:**
- `apps/web/public/llms-full.txt`

**Files Modified:**
- `apps/web/public/llms.txt` - Enhanced with more detail
- `apps/web/app/(marketing)/layout.tsx` - Added JSON-LD schema
- `apps/web/app/components/Footer.tsx` - Updated AI prompt

**Best Practices Applied:**
- Consistent heading hierarchy (H1 → H2 → H3)
- Clear, definitive explanations with code examples
- Comparison tables for competitive positioning
- Schema.org structured data for machine readability
- npm link prominently featured

---

### Plan Limits & Warning Banners

**Goal:** Enforce and display warnings for the 500 response limit for FREE users.

**Implementation:**

1. **`lib/plan-limits.ts`** - Centralized plan limit utilities:
   - `getPlanLimit(plan)` - Returns limit as string ("500" or "∞")
   - `getPlanLimitNum(plan)` - Returns limit as number (500 or 999999)
   - `isOverLimit(plan, responses)` - Returns true if over limit
   - `getAccessibleResponseCount(plan, total)` - Returns capped count for FREE users
   - `shouldShowUpgradeWarning(plan, responses)` - Returns true at 80% (400)

2. **`__tests__/lib/plan-limits.test.ts`** - Comprehensive tests (14 tests):
   - Tests for all 5 functions covering FREE and PRO scenarios
   - Edge cases: exactly at limit, over limit, unknown plans

3. **Dashboard Warning Banners:**
   - **Red banner** when FREE user exceeds 500 responses ("Response limit exceeded")
   - **Yellow banner** when FREE user reaches 80% (400+ responses) ("Approaching response limit")
   - Both include links to upgrade to Pro

**Files Created:**
- `apps/web/lib/plan-limits.ts`
- `apps/web/__tests__/lib/plan-limits.test.ts`

**Files Modified:**
- `apps/web/app/(dashboard)/dashboard/page.tsx` - Added warning banners using imported limit functions

**Test Results:**
- All 71 tests pass (including 14 new plan limit tests)
- Formatting, linting, and type checks all pass

