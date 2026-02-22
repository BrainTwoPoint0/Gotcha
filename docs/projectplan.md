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

**Test Coverage (660 unit tests + E2E):**

| Category | Framework | Tests | Coverage |
|----------|-----------|-------|----------|
| Validation Schemas | Jest | 37 | All modes (feedback, vote, poll, feature-request, A/B) |
| Plan Limits | Jest | 6 | FREE, PRO |
| API Responses Logic | Jest | 20 | Mode mapping, poll calculations, query validation |
| Email Templates | Jest | 20 | All 4 email types, fallback handling |
| API Auth Logic | Jest | 27 | API key validation, domain allowlist, header parsing |
| Stripe Webhooks | Jest | 24 | Event types, status mapping, subscription extraction |
| Export Functionality | Jest | 23 | CSV escaping, date filtering, data transformation |
| Rate Limiting | Jest | 23 | Plan limits, headers, idempotency |
| Analytics Data | Jest | 18 | Aggregations, formatting, calculations |
| SDK Device Utils | Jest | 15 | Touch detection, responsive sizing |
| SDK Anonymous ID | Jest | 14 | ID generation, format validation |
| SDK Retry Logic | Jest | 22 | Exponential backoff, retry decisions |
| SDK Constants | Jest | 19 | URLs, error codes, defaults |
| GDPR Endpoints | Jest | 24 | Data deletion, export, metadata aggregation |
| Dashboard Project | Jest | 17 | Slug generation, name validation |
| Dashboard API Key | Jest | 34 | Key generation, hashing, masking, domain validation |
| Component Logic | Jest | 22 | Button variants, Spinner sizes, Skeleton patterns |
| Middleware Logic | Jest | 29 | Route protection, auth redirects, session validation |
| URL Parameters | Jest | 35 | Pagination, date filters, slug parsing, API key extraction |
| Error Handling | Jest | 37 | Response formatting, status codes, message sanitization |
| Form Validation | Jest | 47 | Email, password, project name, slug, domain, rating |
| Auth Pages | Playwright | 12 | Login, Signup, password validation, protected routes |
| Marketing Pages | Playwright | 9 | Homepage, Pricing, Demo |
| API Endpoints | Playwright | 8 | Auth errors, CORS, demo submission |
| Pro Features | Playwright | 15 | Analytics access, export auth, Stripe endpoints |

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
- `__tests__/lib/email-templates.test.ts` - Email template tests
- `__tests__/lib/api-auth.test.ts` - API authentication logic tests
- `__tests__/lib/rate-limit.test.ts` - Rate limiting tests
- `__tests__/lib/analytics-data.test.ts` - Analytics data processing tests
- `__tests__/api/responses.test.ts` - API logic tests
- `__tests__/api/stripe-webhook.test.ts` - Stripe webhook handler tests
- `__tests__/api/export.test.ts` - Export functionality tests
- `__tests__/api/gdpr.test.ts` - GDPR endpoint logic tests
- `__tests__/sdk/device.test.ts` - SDK device utility tests
- `__tests__/sdk/anonymous.test.ts` - SDK anonymous ID tests
- `__tests__/sdk/retry-logic.test.ts` - SDK retry logic tests
- `__tests__/sdk/constants.test.ts` - SDK constants tests
- `__tests__/dashboard/project.test.ts` - Dashboard project logic tests
- `__tests__/dashboard/api-key.test.ts` - Dashboard API key logic tests
- `__tests__/components/button.test.tsx` - Button/Spinner/Skeleton component tests
- `__tests__/lib/middleware.test.ts` - Middleware and auth redirect tests
- `__tests__/lib/url-params.test.ts` - URL parameter handling tests
- `__tests__/lib/error-handling.test.ts` - Error response formatting tests
- `__tests__/lib/form-validation.test.ts` - Client-side form validation tests
- `e2e/auth.spec.ts` - Authentication E2E tests
- `e2e/marketing.spec.ts` - Marketing pages E2E tests
- `e2e/api.spec.ts` - API endpoint E2E tests
- `e2e/pro-features.spec.ts` - Pro features E2E tests

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

### User Onboarding, Insights & Landing Page Rebrand

**Implemented:** February 2026

**Overview:** Collect user profile data via onboarding + settings, build an internal-only Insights page, enrich dashboard Gotcha widgets with profile metadata, and rebrand the landing page around "communication layer" messaging.

**Changes:**

1. **Prisma Schema** — Added 5 nullable fields to `User`: `companySize`, `role`, `industry`, `useCase`, `onboardedAt`. Applied via `prisma db push`.

2. **Validation (TDD)** — Added `updateProfileSchema` with Zod enums for each field (8 new tests, all passing). Industry options expanded to 10 values (added fintech, analytics, media, devtools).

3. **API Endpoint** (`/api/user/profile`):
   - Extended `PATCH` to accept all profile fields + set `onboardedAt` timestamp
   - Added `GET` handler with `prisma.user.groupBy()` for aggregate insights data

4. **Onboarding Banner** — Shown at top of dashboard when `onboardedAt` is null. Slate-accented card (`bg-slate-50`, left border), 4 select dropdowns, "Save & Continue" button. Constrained to `max-w-2xl`.

5. **Settings Integration** — Extended `ProfileForm` with 4 dropdown selects for the profile fields, pre-filled with saved values.

6. **Insights Page (internal only)** — `/dashboard/insights` with 4 recharts donut pie charts (2x2 grid). Gitignored and removed from sidebar nav — accessible locally only via direct URL.

7. **Dashboard Gotcha Enrichment** — `DashboardFeedback` component now accepts `userProfile` prop. All 5 instances across 4 dashboard pages pass `companySize`, `role`, `industry`, `useCase` as user metadata so feedback submissions include profile context.

8. **Landing Page Rebrand** — Updated hero, features, build-vs-buy, and CTA copy to focus on "communication layer between users and builders" instead of "feedback collection tool."

9. **Type Fixes** — Fixed `pollSelected` type mismatch (`JsonValue` vs `string[]`) in dashboard and responses pages by using `unknown` + `Array.isArray()` guards.

**Files Created (3):**
- `app/(dashboard)/dashboard/onboarding-banner.tsx`
- `app/(dashboard)/dashboard/insights/page.tsx` (gitignored)
- `app/(dashboard)/dashboard/insights/insights-charts.tsx` (gitignored)

**Files Modified (12):**
- `prisma/schema.prisma` — Added profile fields to User model
- `__tests__/lib/validations.test.ts` — Added 8 updateProfileSchema tests
- `lib/validations.ts` — Added enums + updateProfileSchema (10 industry values)
- `app/api/user/profile/route.ts` — Extended PATCH, added GET
- `app/(dashboard)/dashboard/page.tsx` — OnboardingBanner, userProfile on Gotcha, pollSelected fix
- `app/(dashboard)/dashboard/settings/page.tsx` — Passing profile props
- `app/(dashboard)/dashboard/settings/settings-forms.tsx` — Added 4 selects to ProfileForm
- `app/(dashboard)/dashboard/responses/page.tsx` — userProfile on Gotcha, pollSelected fix
- `app/(dashboard)/dashboard/analytics/page.tsx` — userProfile on Gotcha
- `app/(dashboard)/dashboard/analytics/segments/page.tsx` — userProfile on Gotcha
- `app/components/DashboardFeedback.tsx` — Added userProfile prop
- `app/(marketing)/page.tsx` — Rebranded copy
- `.gitignore` — Added insights directory

**Test Results:** 30 suites, 751 tests passing. Production build clean.

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

---

### Loading States & User Feedback

**Goal:** Keep users informed during all loading operations throughout the app.

**Implementation:**

1. **Reusable Components:**
   - `app/components/Spinner.tsx` - Animated spinner with LoadingScreen and LoadingOverlay variants
   - `app/components/Skeleton.tsx` - Skeleton placeholders (text, card, table, stats, chart patterns)
   - `app/components/Button.tsx` - Reusable button with built-in loading state and spinner

2. **Route Loading States** (Next.js `loading.tsx` convention):
   - `/app/(dashboard)/loading.tsx` - Dashboard layout skeleton
   - `/app/(dashboard)/dashboard/loading.tsx` - Main dashboard skeleton
   - `/app/(dashboard)/dashboard/responses/loading.tsx` - Responses table skeleton
   - `/app/(dashboard)/dashboard/analytics/loading.tsx` - Analytics charts skeleton
   - `/app/(dashboard)/dashboard/settings/loading.tsx` - Settings form skeleton
   - `/app/(dashboard)/dashboard/projects/loading.tsx` - Projects list skeleton
   - `/app/(dashboard)/dashboard/projects/[slug]/loading.tsx` - Project detail skeleton
   - `/app/(dashboard)/dashboard/projects/new/loading.tsx` - New project form skeleton
   - `/app/(auth)/loading.tsx` - Auth page skeleton
   - `/app/(auth)/login/loading.tsx` - Login form skeleton
   - `/app/(auth)/signup/loading.tsx` - Signup form skeleton

3. **Form Button Loading States:**
   - Login page - Spinner on "Sign in" button + GitHub OAuth button
   - Signup page - Spinner on "Create account" button + GitHub OAuth button
   - Settings page - Spinner on save buttons

4. **SDK Loading Indicators (v1.0.7):**
   - `packages/sdk/src/components/Spinner.tsx` - SDK spinner component
   - `VoteMode.tsx` - Shows spinner + "Sending..." on clicked button while submitting
   - `FeedbackMode.tsx` - Shows spinner in submit button while submitting
   - Touch-responsive sizing (larger spinners on mobile)

**Files Created:**
- `app/components/Spinner.tsx`
- `app/components/Skeleton.tsx`
- `app/components/Button.tsx`
- 11 `loading.tsx` files across route segments
- `packages/sdk/src/components/Spinner.tsx`

**Files Modified:**
- `app/(auth)/login/page.tsx` - Added Button component with loading state
- `app/(auth)/signup/page.tsx` - Added Button component with loading state
- `packages/sdk/src/components/modes/VoteMode.tsx` - Added loading spinner
- `packages/sdk/src/components/modes/FeedbackMode.tsx` - Added loading spinner

**SDK Version:** Published `gotcha-feedback@1.0.7` with loading indicators

---

### Dark Input Fix

**Issue:** Filter inputs on Analytics and Responses pages appeared dark due to browser dark mode overriding styles.

**Fix:** Added explicit `bg-white text-gray-900` classes to all filter inputs.

**Files Modified:**
- `app/(dashboard)/dashboard/analytics/analytics-filter.tsx`
- `app/(dashboard)/dashboard/responses/responses-filter.tsx`

---

### Expanded Test Coverage

**Test Suites Added (5 new, 192 tests):**

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `__tests__/sdk/loading-states.test.ts` | 35 | Spinner, VoteMode, FeedbackMode loading behavior |
| `__tests__/lib/date-time.test.ts` | 42 | Relative time, formatting, timezones, durations |
| `__tests__/lib/export-formatting.test.ts` | 38 | CSV/JSON export, escaping, sanitization |
| `__tests__/lib/session-management.test.ts` | 39 | Token refresh, storage, cookies, auth state |
| `__tests__/lib/search-filter.test.ts` | 38 | Search, filtering, sorting, pagination |

**Total Test Count:** 26 test suites, 660 tests passing

---

### Mobile Responsiveness, User Metadata & Edit Functionality

**Implementation Date:** January 2026

**Overview:** Three features implemented:
1. Mobile responsiveness fixes across dashboard pages
2. User metadata support for segmentation analytics
3. Edit functionality allowing users to update their previous submissions

---

#### Feature 1: Mobile Responsiveness Fixes

**Changes Made:**
- **Responses Table** (`responses/page.tsx`):
  - Changed header to `flex-col sm:flex-row gap-4` for mobile stacking
  - Hidden "Element" column on mobile (`hidden md:table-cell`)
  - Added `text-xs sm:text-sm` responsive text sizing
  - Reduced padding on mobile (`px-4 sm:px-6`)

- **Pagination** (`pagination.tsx`):
  - Increased touch targets with `py-2 sm:py-1.5` and `min-h-[44px]`
  - Responsive text sizing `text-xs sm:text-sm`

- **Responses Filter** (`responses-filter.tsx`):
  - Changed to `flex flex-col sm:flex-row sm:flex-wrap gap-3`
  - Full-width inputs on mobile (`w-full sm:w-auto`)
  - Touch-friendly buttons with `min-h-[44px]`

- **Analytics Stats Grid** (`analytics/page.tsx`):
  - Changed to `grid-cols-2 md:grid-cols-4` (2x2 on mobile)

- **Analytics Filter** (`analytics-filter.tsx`):
  - Same mobile-first pattern as responses filter
  - Removed fixed `min-w-` constraints

- **Charts** (`charts.tsx`):
  - Responsive heights `h-48 sm:h-64`
  - Responsive padding `p-4 sm:p-6`

- **Settings Page** (`settings/page.tsx`):
  - Responsive padding `p-4 sm:p-6` on form sections
  - Subscription layout `flex-col sm:flex-row`

---

#### Feature 2: User Metadata & Segmentation

**Database Schema Changes:**
- Added `MetadataField` model to Prisma schema:
  - `fieldKey` - field name (e.g., "age", "plan")
  - `displayName` - user-friendly label
  - `fieldType` - "string" | "number" | "boolean"
  - `isActive` - toggle for segmentation

**New API Endpoints:**
- `GET /api/v1/metadata/fields` - Auto-discover metadata fields from response data
- `GET/POST/PATCH/DELETE /api/projects/[slug]/metadata-fields` - CRUD for field configuration
- `GET /api/analytics/segment` - Segmented analytics data (grouped by metadata field)

**New Dashboard Pages:**
- `/dashboard/analytics/segments` - Segmentation page with:
  - Project and "Group by" field selectors
  - Response volume by segment (bar chart)
  - Average rating by segment (bar chart)
  - Positive rate by segment (bar chart)
  - Comparison table
- `/dashboard/projects/[slug]/settings/metadata` - Metadata configuration UI:
  - List of configured fields with edit/toggle/remove
  - Auto-discovered fields from response data
  - Sample values and occurrence counts

**Navigation Updates:**
- Added "Segments" nav item with Pro badge in dashboard layout
- Added "Metadata Settings" link on project detail page

**Files Created:**
- `app/api/v1/metadata/fields/route.ts`
- `app/api/projects/[slug]/metadata-fields/route.ts`
- `app/api/analytics/segment/route.ts`
- `app/(dashboard)/dashboard/analytics/segments/page.tsx`
- `app/(dashboard)/dashboard/analytics/segments/segment-charts.tsx`
- `app/(dashboard)/dashboard/projects/[slug]/settings/metadata/page.tsx`
- `app/(dashboard)/dashboard/projects/[slug]/settings/metadata/metadata-fields-manager.tsx`

---

#### Feature 3: Edit Functionality & Duplicate Prevention

**Database Schema Changes:**
- Added unique constraint on Response: `@@unique([projectId, elementIdRaw, endUserId])`

**New API Endpoints:**
- `GET /api/v1/responses/check` - Check if user has existing response for element
- `PATCH /api/v1/responses/[id]` - Update existing response (with user ownership validation)

**SDK Updates:**

*Types (`types.ts`):*
- Added `ExistingResponse` interface with all response fields

*API Client (`client.ts`):*
- Added `checkExistingResponse(elementId, userId)` method
- Added `updateResponse(id, payload, userId)` method

*useSubmit Hook (`useSubmit.ts`):*
- Added `existingResponse` and `isEditing` state
- Auto-checks for existing response on mount when user ID provided
- Submits update instead of create when editing

*Mode Components:*
- `FeedbackMode.tsx` - Added `initialValues` and `isEditing` props, pre-fills form
- `VoteMode.tsx` - Added `initialVote` and `isEditing` props, highlights previous vote

*GotchaModal & Gotcha Components:*
- Pass through `existingResponse` and `isEditing` props
- Dynamic button text ("Update" vs "Submit")
- Dynamic thank you message for edits

**Files Created:**
- `app/api/v1/responses/check/route.ts`
- `app/api/v1/responses/[id]/route.ts`
- `__tests__/api/responses-edit.test.ts` (24 tests)
- `__tests__/lib/user-metadata.test.ts` (17 tests)

**Files Modified:**
- `prisma/schema.prisma` - Added MetadataField model and unique constraint
- `packages/sdk/src/types.ts`
- `packages/sdk/src/api/client.ts`
- `packages/sdk/src/hooks/useSubmit.ts`
- `packages/sdk/src/components/Gotcha.tsx`
- `packages/sdk/src/components/GotchaModal.tsx`
- `packages/sdk/src/components/modes/FeedbackMode.tsx`
- `packages/sdk/src/components/modes/VoteMode.tsx`
- `app/(dashboard)/layout.tsx` - Added Segments nav

---

**Test Coverage:**
- `__tests__/api/responses-edit.test.ts` - 24 tests for edit validation and ownership
- `__tests__/lib/user-metadata.test.ts` - 17 tests for metadata inference and segmentation
- `__tests__/api/metadata-fields.test.ts` - 19 tests for auto-discovery and field validation
- `__tests__/api/analytics-segment.test.ts` - 19 tests for segmented analytics grouping and stats

**Total Tests:** 739 tests (30 test suites, all passing)

---

### SDK v1.0.9 - Documentation & URL Fix

**Published:** January 2026

**Changes:**

1. **Fixed API Base URL:**
   - Changed from `https://api.gotcha.cx/v1` to `https://gotcha.cx/api/v1`
   - Removed unused `API_STAGING_URL` constant
   - Updated in `packages/sdk/src/constants.ts`

2. **Enhanced README Documentation:**
   - Added "User Segmentation" and "Edit Support" to Features list
   - Expanded "With User Data" example showing dynamic values:
     - `currentUser.id`, `currentUser.email`, `user.age`, `user.country`
     - Device/browser detection examples
   - Added "User Metadata & Segmentation" section with use case examples:
     - Segment by subscription plan
     - Segment by device type
     - Segment by country
     - Segment by user tenure
   - Added "Edit Previous Submissions" section explaining:
     - How edit mode works
     - Required `user.id` for functionality
     - UI changes (Update vs Submit button)
   - Updated `baseUrl` default in props table to show actual URL

**Files Modified:**
- `packages/sdk/src/constants.ts` - Fixed API URL, removed staging URL
- `packages/sdk/README.md` - Comprehensive documentation updates

**SDK Version:** Published `gotcha-feedback@1.0.9`

---

### Element Filtering

**Added:** January 2026

Added element filtering to dashboard pages, allowing users to filter responses and segments by specific elements (e.g., "feature-card", "pricing-section").

**Changes:**

1. **Responses Page** (`/dashboard/responses`):
   - Added element dropdown to filter showing all elements with response counts
   - Filter persists in URL params (`?elementId=feature-card`)
   - Elements sorted by response count (descending)

2. **Analytics Page** (`/dashboard/analytics`):
   - Added element dropdown between Project and date filters
   - Filter analytics to a specific element
   - Subtitle shows selected element

3. **Segments Page** (`/dashboard/analytics/segments`):
   - Added element dropdown between Project and Group By filters
   - Can now analyze segments for a specific element
   - Subtitle shows selected element

**Files Modified:**
- `app/(dashboard)/dashboard/responses/responses-filter.tsx` - Added element dropdown
- `app/(dashboard)/dashboard/responses/page.tsx` - Fetch elements, pass to filter, handle query
- `app/(dashboard)/dashboard/analytics/analytics-filter.tsx` - Added element dropdown
- `app/(dashboard)/dashboard/analytics/page.tsx` - Fetch elements, pass to filter, handle query
- `app/(dashboard)/dashboard/analytics/segments/segment-charts.tsx` - Added element filter
- `app/(dashboard)/dashboard/analytics/segments/page.tsx` - Fetch elements, handle query

---

### Project Limit Enforcement

**Added:** January 2026

FREE plan users are now properly limited to 1 project. Previously, users could bypass the limit by directly navigating to `/dashboard/projects/new`.

**Changes:**

1. **Plan Limit Functions** (`lib/plan-limits.ts`):
   - `getProjectLimit(plan)` - Returns project limit (1 for FREE, 999999 for PRO)
   - `getProjectLimitDisplay(plan)` - Returns display string ("1" or "∞")
   - `isOverProjectLimit(plan, count)` - Returns true if at or over limit

2. **API Enforcement** (`app/api/projects/route.ts`):
   - Checks project count against plan limit before creating
   - Returns 403 with `PROJECT_LIMIT_REACHED` code if over limit

3. **UI Enforcement** (`app/(dashboard)/dashboard/projects/new/`):
   - Split into server component (`page.tsx`) and client component (`new-project-form.tsx`)
   - Server component checks limit and shows "Project Limit Reached" message with upgrade CTA
   - Only shows form if user is under limit

**Files Created:**
- `app/(dashboard)/dashboard/projects/new/new-project-form.tsx` - Client form component

**Files Modified:**
- `lib/plan-limits.ts` - Added project limit functions
- `app/api/projects/route.ts` - Added limit check before project creation
- `app/(dashboard)/dashboard/projects/new/page.tsx` - Converted to server component with limit gate

**Test Results:** All 739 tests pass

---

### SDK v1.0.10 — UI Redesign

**Published:** February 2026

**Overview:** Major visual overhaul of the G button and mode components to achieve a premium glassmorphism aesthetic.

**Changes:**

1. **G Button — Glassmorphism Styling:**
   - Replaced flat background with glass-bubble/dome effect
   - Light mode: blue-gray tinted gradient (`rgba(200,210,230,0.4)`) with `backdrop-filter: blur(16px) saturate(170%)`
   - Dark mode: subtle white-to-transparent gradient with `1px solid rgba(255,255,255,0.15)` border
   - 4-layer box-shadows for 3D depth (outer grounding, tight edge, inset top refraction, inset bottom depth)
   - No border in light mode (white border created visible seam on small circles)

2. **G Icon — Carter One Font:**
   - Replaced SVG-based G with text-based `<span>G</span>` using Google Fonts "Carter One"
   - Dynamic font loading via `<link>` tag injection (deduped by element ID)
   - Icon size: `buttonSize * 0.65` with small marginTop/marginRight nudges for centering

3. **Auto Theme Fix:**
   - Added `getInitialSystemTheme()` that reads `window.matchMedia('(prefers-color-scheme: dark)')` synchronously
   - Used as useState initializer to prevent flash on first render
   - Added `MediaQueryListEvent` listener to keep theme in sync when OS preference changes

4. **Submit Button Colors (FeedbackMode):**
   - Changed from indigo (`#6366f1`) to dark slate (`#1e293b`) for light mode
   - Inverted for dark mode: light gray background (`#e2e8f0`) with dark text (`#1e293b`)
   - Updated hover, disabled, and spinner colors accordingly

5. **Vote Mode Button Fix:**
   - Fixed button expansion during submission by scoping `transition` from `'all'` to specific properties (`background-color, border-color, color, transform, box-shadow`)
   - Added `minWidth: 0` and `overflow: 'hidden'` to prevent content-driven width changes

6. **Dev Demo Page:**
   - Updated theme section backgrounds to colorful gradients so glassmorphism is visible
   - Light: `from-sky-100 via-indigo-100 to-purple-100`
   - Dark: `from-gray-800 via-gray-900 to-slate-900`
   - Auto: `from-amber-100 via-rose-100 to-violet-100`

**Files Modified:**
- `packages/sdk/src/components/GotchaButton.tsx` — Glassmorphism, Carter One font, auto theme
- `packages/sdk/src/components/modes/FeedbackMode.tsx` — Submit button colors
- `packages/sdk/src/components/modes/VoteMode.tsx` — Transition and flex fixes
- `apps/web/app/dev/page.tsx` — Gradient backgrounds for theme demos
- `packages/sdk/package.json` — Version bump to 1.0.10

**SDK Version:** `gotcha-feedback@1.0.10`

---

### SDK v1.0.12 — Performance & Error Handling

**Published:** February 2026

**Overview:** Reduced perceived submission latency from ~4 seconds to ~500ms and added default error handling.

**Changes:**

1. **Async API Response (Server):**
   - API endpoint (`POST /api/v1/responses`) now responds immediately after validation
   - Validates API key, rate limit, and request body (blocking ~500ms)
   - Returns 201 with generated response ID before DB writes
   - Element lookup/creation, response storage, and usage tracking happen asynchronously in the background
   - Errors in async DB writes are logged server-side (`console.error`)

2. **Thank You Duration:**
   - Auto-close timer set to 3 seconds after success

3. **Default Error Handling:**
   - Added `console.warn('[Gotcha] Submission failed: ...')` that always fires on error
   - Works even without an explicit `onError` prop, so developers see errors in console
   - Modal still shows inline red error box for user-facing feedback
   - `onError` callback remains available for custom handling (toasts, Sentry, etc.)

4. **Button Styling:**
   - Removed all inset box-shadows from GotchaButton (caused straight-line artifacts at circle edges)
   - Glass depth now comes purely from gradient + outer drop shadows + backdrop blur

**Files Modified:**
- `apps/web/app/api/v1/responses/route.ts` — Async DB writes, immediate response
- `packages/sdk/src/components/Gotcha.tsx` — 3s auto-close, default console.warn on error
- `packages/sdk/src/components/GotchaButton.tsx` — Removed inset shadows

**SDK Version:** `gotcha-feedback@1.0.12`

---

### Marketing Improvements (CRO Quick Wins)

**Implemented:** February 2026

**Overview:** Addressed critical gaps identified in a CRO audit (`docs/marketing-analysis.md`): vague messaging, no product demo on homepage, misleading pricing label, no annual option, and static onboarding.

**Changes:**

1. **Homepage Hero Copy & CTAs** — Rewrote subtitle to lead with the differentiator ("Attach feedback to any component..."). Changed primary CTA from "Start for Free" to "Add Feedback in 5 Minutes". Added npm package link near install block.

2. **Homepage Feature Cards** — Rewrote all 6 cards with benefit-first titles: "Feedback Where It Matters", "5 Minutes to First Feedback", "Ratings, Votes, and Polls", "Zero Performance Impact", "See What Users Really Think", "Built for How You Already Work".

3. **Homepage Live Demo Section** — New `HomepageDemo` client component showing 3 live Gotcha widgets (feedback, vote, poll) side-by-side between the code example and features sections. Uses `gotcha-feedback` npm package.

4. **Pricing Toggle + Recommended Badge** — Changed "Most Popular" to "Recommended". Added monthly/annual toggle with $24/mo annual pricing ($288/yr) and "Save 17%" badge. Extracted `PricingToggle` client component for toggle state.

5. **Special Program Pricing Hints** — Added concrete pricing info: "Pro features at 50% off" (Education), "3 months of Pro free" (Startups), "Custom portfolio pricing" (Investors).

6. **Interactive Onboarding Checklist** — Replaced static 3-step Quick Start Guide with interactive 4-step checklist. Auto-checks based on real data (`hasProjects`, `hasResponses`). Shows to all users with 0 responses (not just 0 projects). Displays celebration message when all steps complete.

**Files Created (3):**
- `apps/web/app/components/HomepageDemo.tsx` — Live demo section
- `apps/web/app/(marketing)/pricing/pricing-toggle.tsx` — Billing toggle + tier cards
- `apps/web/app/(dashboard)/dashboard/onboarding-checklist.tsx` — Interactive checklist

**Files Modified (3):**
- `apps/web/app/(marketing)/page.tsx` — Hero copy, CTAs, feature cards, demo import
- `apps/web/app/(marketing)/pricing/page.tsx` — Pricing toggle, program hints
- `apps/web/app/(dashboard)/dashboard/page.tsx` — Replaced Quick Start with checklist

**Test Results:** 30 suites, 751 tests passing. Production build clean.

---

### Gate Response Data for FREE Users Over 500/month

**Implemented:** February 2026

**Overview:** FREE users who exceed 500 responses/month can no longer view their response data. The API continues collecting responses (intentional), but *access* to the data is gated behind an upgrade prompt. This creates a natural incentive to upgrade to Pro.

**Changes:**

1. **Fixed Misleading Banner Text** (`dashboard/page.tsx`):
   - Changed "New responses will not be recorded until you upgrade" → "Your responses are still being collected, but you need to upgrade to Pro to view new data."

2. **Dashboard — Gated Recent Responses** (`dashboard/page.tsx`):
   - Computed `overLimit` flag once and reused across banners and data queries
   - When over limit: skips the DB query for recent responses (no point fetching gated data)
   - Shows a locked card with lock icon, "Responses locked" message, and "Upgrade to Pro" CTA
   - Stats cards (total responses, this month count) remain visible so users know data exists

3. **Responses Page — Gated Table** (`dashboard/responses/page.tsx`):
   - Added `isOverLimit` import and computed `overLimit` from subscription data
   - When over limit: skips DB queries for responses and element filters
   - Still fetches total count so upgrade prompt can show "You have X responses"
   - Shows full-width upgrade card matching the analytics Pro-gate pattern (lock icon, count, CTA)
   - Hides the "30 days" free-tier banner when over limit (redundant)

**Files Modified (2):**
- `apps/web/app/(dashboard)/dashboard/page.tsx` — Banner text fix, recent responses gating
- `apps/web/app/(dashboard)/dashboard/responses/page.tsx` — Full table gating with upgrade prompt

**Test Results:** 30 suites, 751 tests passing. Production build clean.

---

### Optimize Dashboard Gotcha Placements

**Implemented:** February 2026

**Overview:** Changed dashboard Gotcha widgets from all-feedback to mode-appropriate placements for higher response rates and more actionable signal.

**Changes:**

1. **`DashboardFeedback` component** — Added optional `mode`, `voteLabels`, `options`, `allowMultiple` props. All pass through to `<Gotcha>`. Default mode stays `"feedback"` for backwards compatibility.

2. **Dashboard Overview** → Changed to `mode="vote"` with prompt "Is this dashboard useful?"

3. **Responses Page** → Changed to `mode="poll"` with prompt "What would make this page more useful?" and 4 options (Better filtering, Export to CSV, Response tagging, Bulk actions).

4. **Analytics Page** → Changed both gated and PRO instances to `mode="poll"` with prompt "What analytics matter most to you?" and 4 options (Sentiment trends, Response heatmaps, User segments, Comparison reports). Fixed missing `userProfile` on the PRO instance.

5. **Segments Page** → Kept as feedback (newer feature, open-ended is appropriate). Fixed missing `userProfile` on the PRO instance.

6. **Settings Page** → Added new `DashboardFeedback` with `mode="vote"` and prompt "Is the setup process clear?"

**Files Modified (6):**
- `apps/web/app/components/DashboardFeedback.tsx` — Added mode/poll/vote props
- `apps/web/app/(dashboard)/dashboard/page.tsx` — Vote mode
- `apps/web/app/(dashboard)/dashboard/responses/page.tsx` — Poll mode
- `apps/web/app/(dashboard)/dashboard/analytics/page.tsx` — Poll mode + userProfile fix
- `apps/web/app/(dashboard)/dashboard/analytics/segments/page.tsx` — userProfile fix
- `apps/web/app/(dashboard)/dashboard/settings/page.tsx` — Added vote widget

**Build:** Clean, no errors.

---

## Pre-Launch Security Fixes

> **Goal:** Harden the public repo before launch

### Todo

- [x] **1. Delete debug API routes** — Remove `apps/web/app/api/debug/` entirely (6 routes that leak env info with zero auth)
- [x] **2. Fix API key generation** — Replace `Math.random()` with `crypto.randomBytes()` in `lib/api-auth.ts`
- [x] **3. Switch to hash-based API key lookup** — All 3 internal routes now use `keyHash` instead of plaintext `key` for DB lookup (full column removal deferred — dashboard still shows keys to users)
- [x] **4. Scope CORS wildcard** — Change `netlify.toml` to only apply `Access-Control-Allow-Origin: *` to `/api/v1/*`
- [x] **5. Add origin check to internal responses endpoint** — Restrict `/api/v1/internal/responses` to same-origin requests only

---

## Configurable Feedback Fields (showText / showRating)

> **Goal:** Let developers choose whether FeedbackMode shows text input, star rating, or both.

### Todo

- [x] **1. Write unit tests** — Add tests for the new `showText`/`showRating` prop combinations (text-only, rating-only, both, neither guard)
- [x] **2. Add props to `FeedbackMode`** — Add `showText?: boolean` (default `true`) and `showRating?: boolean` (default `true`) to `FeedbackModeProps`. Conditionally render each section. Update submit validation to match visible fields.
- [x] **3. Thread props through `GotchaModal`** — Add `showText`/`showRating` to `GotchaModalProps` and pass them down to `FeedbackMode`.
- [x] **4. Add props to `Gotcha`** — Add `showText`/`showRating` to `GotchaProps` and pass through to both desktop and mobile `GotchaModal` instances.
- [x] **5. Update dev page** — Add examples to `apps/web/app/dev/page.tsx` showing text-only and rating-only variants.
- [x] **6. Run tests & build** — Verify all tests pass and production build is clean.

### Review

**Summary:** Added `showText` and `showRating` boolean props to the SDK's feedback mode, allowing developers to show text-only, rating-only, or both (default).

**Files Created (1):**
- `apps/web/__tests__/sdk/feedback-fields.test.ts` — 22 tests covering field visibility, submit validation, payload construction, and prop defaults

**Files Modified (4):**
- `packages/sdk/src/components/modes/FeedbackMode.tsx` — Added `showText`/`showRating` props, conditional rendering, updated submit validation to use `canSubmit`
- `packages/sdk/src/components/GotchaModal.tsx` — Added props to interface, destructured with defaults, passed to FeedbackMode
- `packages/sdk/src/components/Gotcha.tsx` — Added props to GotchaProps interface, destructured, passed to both desktop and mobile modal instances
- `apps/web/app/dev/page.tsx` — Added "Feedback Field Options" section with text-only, rating-only, and both variants

**Test Results:** 32 suites, 794 tests passing. TypeScript clean.

---

## Launch Readiness: Security & Quality Fixes

**Implemented:** February 2026

**Overview:** Addressed 20 issues across 5 categories before public launch.

### Group 1: Security (5 tasks)

- [x] **S1. Fix open redirect in auth callback** — Created `lib/auth-redirect.ts` with `sanitizeRedirectPath()` that rejects protocol-relative URLs (`//evil.com`), absolute URLs, backslash tricks, and paths not starting with `/`. Applied to `app/auth/callback/route.ts`. Test: `__tests__/lib/auth-redirect.test.ts` (10 tests).

- [x] **S2. Fix weak origin check on internal API** — Created `lib/origin-check.ts` with `isOriginAllowed()` that uses `new URL(origin).hostname === host.split(':')[0]` instead of `origin.includes(host)`. Prevents subdomain spoofing like `gotcha.cx.evil.com`. Test: `__tests__/api/internal-origin.test.ts` (7 tests).

- [x] **S3. Remove error message leak in dashboard** — Replaced `<pre>{error.message}</pre>` in dashboard catch block with generic "Something went wrong" message. Error still logged via `console.error`.

- [x] **S4. Prevent Stripe double-checkout** — Created `lib/stripe-guards.ts` with `shouldBlockCheckout()` that checks if subscription is already PRO + ACTIVE. Returns 400 if true. Applied to `/api/stripe/checkout`. Test: `__tests__/api/stripe-checkout.test.ts` (4 tests).

- [x] **S5. Add HSTS security header** — Added `Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"` to `netlify.toml` security headers block.

### Group 2: Infrastructure (3 tasks)

- [x] **I1. Monthly usage counter reset** — Created `lib/usage-reset.ts` with `shouldResetCounter()` that checks if `responsesResetAt` is before start of current month. Applied to `/api/v1/responses` — resets counter to 1 and updates timestamp on first request of a new month. Test: `__tests__/api/usage-reset.test.ts` (5 tests).

- [x] **I2. Add missing env vars to .env.example** — Added `GOTCHA_SDK_API` and `NEXT_PUBLIC_SITE_URL`.

- [x] **I3. Add global error boundary** — Created `app/global-error.tsx` with generic error UI, "Try again" button, and structured JSON console logging.

### Group 3: SEO & Legal (7 tasks)

- [x] **L1. Create robots.txt** — Created `public/robots.txt` allowing `/`, disallowing `/dashboard` and `/api/`, referencing sitemap.

- [x] **L2. Create dynamic sitemap** — Created `app/sitemap.ts` with 7 pages: `/`, `/pricing`, `/demo`, `/privacy`, `/terms`, `/login`, `/signup`.

- [x] **L3. Create Privacy Policy page** — Created `app/(marketing)/privacy/page.tsx` covering data collected, third-party services, cookies, GDPR rights.

- [x] **L4. Create Terms of Service page** — Created `app/(marketing)/terms/page.tsx` covering acceptable use, data ownership, plan limits, liability.

- [x] **L5. Fix dead legal links** — Changed `href="#"` to `/privacy` and `/terms` in signup page. Added Legal column with Privacy/Terms links to Footer.

- [x] **L6. Add OpenGraph meta tags** — Added `openGraph` and `twitter` metadata to root `app/layout.tsx`.

- [x] **L7. Update JSON-LD version** — Changed `softwareVersion: '1.0.0'` to `'1.0.18'` in marketing layout.

### Group 4: Performance (3 tasks)

- [x] **P1. Analytics page — DB-level aggregation** — Replaced `findMany` + JS processing with `groupBy` for mode counts, `aggregate` for rating avg, `$queryRaw` for daily trend, `groupBy` by vote for sentiment. All run in `Promise.all()`.

- [x] **P2. Segments page — safety limit** — Added `take: 10000` safety cap to response query. Shows yellow banner if data was capped.

- [x] **P3. Responses page — parallelize queries** — Wrapped 4 sequential queries (elements groupBy, total count, gated count, findMany) in `Promise.all()`.

### Group 5: Cleanup (2 tasks)

- [x] **C1. Add author to SDK package.json** — Added `"author": "Gotcha <info@braintwopoint0.com>"`.

- [x] **C2. Comment stale Plan enum** — Added comment explaining only FREE and PRO are used, others retained to avoid migration.

### Bonus Fix

- [x] **Pre-existing type error** — Fixed `experimentId`/`variant` type errors in both `/api/v1/responses/route.ts` and `/api/v1/internal/responses/route.ts` by extending the validated data type with optional A/B experiment fields. This was a pre-existing build failure.

### Files Created (14)
- `apps/web/lib/auth-redirect.ts`
- `apps/web/lib/origin-check.ts`
- `apps/web/lib/stripe-guards.ts`
- `apps/web/lib/usage-reset.ts`
- `apps/web/__tests__/lib/auth-redirect.test.ts`
- `apps/web/__tests__/api/internal-origin.test.ts`
- `apps/web/__tests__/api/stripe-checkout.test.ts`
- `apps/web/__tests__/api/usage-reset.test.ts`
- `apps/web/app/global-error.tsx`
- `apps/web/app/sitemap.ts`
- `apps/web/app/(marketing)/privacy/page.tsx`
- `apps/web/app/(marketing)/terms/page.tsx`
- `apps/web/public/robots.txt`

### Files Modified (16)
- `apps/web/app/auth/callback/route.ts` — Import sanitizeRedirectPath
- `apps/web/app/api/v1/internal/responses/route.ts` — Strict origin check, type fix
- `apps/web/app/api/v1/responses/route.ts` — Usage counter reset, type fix
- `apps/web/app/api/stripe/checkout/route.ts` — Double-checkout guard
- `apps/web/app/(dashboard)/dashboard/page.tsx` — Remove error message leak
- `apps/web/app/(dashboard)/dashboard/responses/page.tsx` — Parallelize queries
- `apps/web/app/(dashboard)/dashboard/analytics/page.tsx` — DB-level aggregation
- `apps/web/app/(dashboard)/dashboard/analytics/segments/page.tsx` — Safety limit
- `apps/web/app/(auth)/signup/page.tsx` — Fix dead legal links
- `apps/web/app/components/Footer.tsx` — Add Legal column
- `apps/web/app/layout.tsx` — OpenGraph meta tags
- `apps/web/app/(marketing)/layout.tsx` — Update JSON-LD version
- `apps/web/.env.example` — Add missing env vars
- `apps/web/prisma/schema.prisma` — Comment stale Plan enum
- `netlify.toml` — HSTS header
- `packages/sdk/package.json` — Add author

### Verification

- **Unit tests:** 36 suites, 815 tests — all passing
- **Production build:** Clean (0 errors)
- **New pages:** `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml` all render correctly

---

## Launch Readiness Round 2: Post-Audit Security & Quality Fixes

**Implemented:** February 2026

**Overview:** Second security + production-readiness pass before launch. 8 tasks across security and hardening.

### Group 1: Security (6 tasks)

- [x] **S6. Fix weak origin check on 2 internal sub-routes** — Replaced `!origin.includes(host)` with `isOriginAllowed()` (from `lib/origin-check.ts`) in both `[id]/route.ts` and `check/route.ts`. Prevents subdomain spoofing.

- [x] **S7. Fix open redirect via x-forwarded-host** — Removed all `forwardedHost` branches in `auth/callback/route.ts`. Both success and error redirects now always use `origin` (safe, derived from `new URL(request.url)`).

- [x] **S8. Fix CSV injection in export** — Extracted `escapeCsvField()` to `lib/csv-escape.ts`. Added formula injection sanitization: prepends `'` when field starts with `=`, `+`, `-`, `@`, `\t`, or `\r`. Test: `__tests__/lib/csv-escape.test.ts` (12 tests).

- [x] **S9. Add safety limit to export query** — Added `take: 50000` to the `findMany` in `api/export/responses/route.ts`. Prevents unbounded queries.

- [x] **S10. Tighten input validation** — Added `content.max(10000)`, `title.max(500)`, `elementId.max(200)` to `submitResponseSchema`. Replaced `userSchema.passthrough()` with `.catchall(z.unknown())` + 4KB size refine.

- [x] **S11. Fix usage counter race condition** — Created `lib/usage-atomic.ts` with `atomicIncrementUsage()` using single `$executeRaw` SQL that conditionally resets or increments in one atomic query. Replaced the TOCTOU read-then-update pattern in `api/v1/responses/route.ts`. Test: `__tests__/api/usage-atomic.test.ts` (5 tests).

### Group 2: Hardening (2 tasks)

- [x] **H1. Add OG image for social sharing** — Created `app/opengraph-image.tsx` using Next.js ImageResponse (dark gradient with "Gotcha" branding). Added `images` to openGraph metadata and `metadataBase` to fix build warnings.

- [x] **H2. Add health check endpoint** — Created `app/api/health/route.ts` returning `{ status: 'ok', timestamp }`.

### Files Created (5)
- `apps/web/lib/csv-escape.ts`
- `apps/web/lib/usage-atomic.ts`
- `apps/web/__tests__/lib/csv-escape.test.ts`
- `apps/web/__tests__/api/usage-atomic.test.ts`
- `apps/web/app/opengraph-image.tsx`
- `apps/web/app/api/health/route.ts`

### Files Modified (7)
- `apps/web/app/api/v1/internal/responses/[id]/route.ts` — Import + use `isOriginAllowed()`
- `apps/web/app/api/v1/internal/responses/check/route.ts` — Import + use `isOriginAllowed()`
- `apps/web/app/auth/callback/route.ts` — Removed x-forwarded-host branches
- `apps/web/app/api/export/responses/route.ts` — CSV injection fix, take limit, shared import
- `apps/web/lib/validations.ts` — Max lengths + userSchema size limit
- `apps/web/app/api/v1/responses/route.ts` — Atomic usage increment
- `apps/web/app/layout.tsx` — OG image, metadataBase

### Verification

- **Unit tests:** 38 suites, 832 tests — all passing
- **Production build:** Clean (0 errors)
- **New endpoint:** `/api/health` returns 200

---

## Pre-Launch Production Readiness Audit

**Date:** February 2026

**Scope:** Final audit of all API routes, middleware, database schema, build config, SEO, and edge cases before public launch.

### Audit Summary

The codebase is in solid shape for launch. Previous security audits addressed the major issues (input validation, rate limiting, origin checks, CSV injection, atomic usage counters, auth redirect sanitization, etc.). This audit found **5 actionable findings** and confirmed that the remaining areas are production-ready.

### Finding 1: Missing `not-found.tsx` page (Medium)

**Issue:** There is no custom 404 page. When users hit a non-existent route, they see the default Next.js 404. For a launched product, a branded 404 page with navigation back to the homepage or dashboard would improve user experience.

**Location:** `apps/web/app/not-found.tsx` (does not exist)

**Recommendation:** Create `app/not-found.tsx` with a simple branded layout and links to `/` and `/dashboard`.

---

### Finding 2: Subscription record not created during email/password signup (Medium-High)

**Issue:** When a user signs up via **email/password** and navigates to `/dashboard`, the middleware redirects do not trigger the `/auth/callback` route. The callback route (which creates the Prisma user, organization, and subscription) only fires for **OAuth (GitHub)** logins.

For email/password signups, the user record and organization are lazily created in two places:
- `dashboard/page.tsx` (line 63-121) -- creates user + org + subscription
- `api/projects/route.ts` (line 44-81) -- creates user + org + subscription

This is **working correctly** because the dashboard page has the fallback creation logic. However, the dashboard fallback does create the subscription (line 89-94), but it does **not** set `responsesResetAt`, while the projects API route does set it (line 78). The auth callback also does not set it. This means the first monthly usage reset will be triggered by the atomic increment function, which handles the null case correctly. So this is safe but inconsistent.

**Recommendation:** No action strictly required -- the `atomicIncrementUsage()` function handles `responsesResetAt: null` correctly. But for consistency, set `responsesResetAt: new Date()` in the dashboard's lazy user creation (line 89-94) to match what `api/projects/route.ts` does.

---

### Finding 3: `stripeCustomerId` index missing on Subscription table (Low)

**Issue:** The Stripe webhook handler looks up subscriptions by `stripeCustomerId` using `findFirst`:
- `customer.subscription.updated` (webhook line 67)
- `customer.subscription.deleted` (webhook line 99)
- `invoice.payment_failed` (webhook line 121)

The schema has `@@index([stripeCustomerId])` on the Subscription model. This is already present and correct. **No action needed.** The schema is properly indexed for all webhook lookup patterns.

---

### Finding 4: Demo endpoint accepts arbitrary JSON without size limit (Low)

**Issue:** The `/api/v1/demo/responses` endpoint calls `request.json()` without body size validation. Since this is a demo-only endpoint that discards the data (just returns a mock response), the risk is limited to a theoretical memory exhaust from a huge POST body. However, Netlify and Next.js have built-in body size limits (~5MB), so this is not practically exploitable.

**Location:** `/Users/karimfawaz/Dev Projects/gotcha/apps/web/app/api/v1/demo/responses/route.ts`

**Recommendation:** No action required. The existing 300ms delay and lack of DB writes make this low-risk. Netlify's infrastructure limits protect against abuse.

---

### Finding 5: `invoice.payment_failed` webhook does not check for `null` subscription (Low)

**Issue:** In the Stripe webhook handler, the `invoice.payment_failed` case updates the subscription to `PAST_DUE`. This correctly handles the case where the subscription exists. If `findFirst` returns null (no matching customer), the handler silently skips the update, which is the correct behavior. **No action needed.**

---

### Areas Confirmed Production-Ready

**1. Error Handling:** All 20 API routes have try/catch blocks. No stack traces leak to clients. Error responses use generic messages. The `global-error.tsx` boundary catches unhandled client errors.

**2. Environment Config (.env.example):** All 13 required env vars are documented. The `netlify.toml` is correctly configured with security headers (HSTS, X-Frame-Options, CSP-adjacent headers, etc.), CORS scoped to `/api/v1/*`, and static asset caching.

**3. Database Schema Indexes:** All query patterns have corresponding indexes:
- `Response`: indexes on `projectId`, `elementId`, `[projectId, elementIdRaw]`, `experimentId`, `createdAt`, `endUserId`, `idempotencyKey`
- `ApiKey`: indexes on `keyHash`, `projectId`
- `Subscription`: index on `stripeCustomerId`
- All foreign keys have cascade deletes configured correctly

**4. Middleware:** The matcher correctly covers `/dashboard/:path*`, `/projects/:path*`, `/login`, and `/signup`. Protected routes redirect to `/login`. Auth pages redirect logged-in users to `/dashboard`. The Supabase cookie refresh pattern is correct.

**5. Build/Deploy:** The `package.json` scripts are correct. `prisma generate` runs both in `build` and `postinstall`. The `netlify.toml` base directory, build command, publish directory, and Node version are all correct. The `@netlify/plugin-nextjs` is included.

**6. SEO:** `sitemap.ts` covers all 7 public pages. `robots.txt` disallows `/dashboard` and `/api/`. Root layout has OpenGraph + Twitter Card metadata with `metadataBase`. Marketing layout has JSON-LD structured data. OG image exists.

**7. Stripe Webhook:** All 4 event types are handled (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`). Signature verification is correct. The `upsert` pattern handles edge cases where subscription records may not exist. Double-checkout prevention is in place.

**8. Free Tier Limits:** The 500 response/month limit is enforced correctly. Usage is atomically incremented with month-boundary reset. Warning emails fire at 400/450/500. Dashboard shows appropriate gating UI. Responses over the limit are still collected but marked as `gated=true` and redacted server-side for free users.

**9. No TODO/FIXME/HACK comments** found in any TypeScript files.

**10. GDPR endpoints** (user delete + export) are properly API-key authenticated with project scoping.

### Todo

- [ ] Create `app/not-found.tsx` custom 404 page
- [ ] Set `responsesResetAt: new Date()` in dashboard lazy user creation for consistency

