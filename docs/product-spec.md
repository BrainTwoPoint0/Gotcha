# Gotcha — Product Specification Document

> **Version:** 1.0.5
> **Last Updated:** January 22, 2026
> **Author:** Karim
> **Purpose:** Complete technical and product specification for building Gotcha using Claude Code

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision](#3-product-vision)
4. [Target Users](#4-target-users)
5. [Competitive Analysis](#5-competitive-analysis)
6. [Core Features](#6-core-features)
7. [Technical Architecture](#7-technical-architecture)
8. [Database Schema](#8-database-schema)
9. [API Specification](#9-api-specification)
10. [SDK/Package Design](#10-sdkpackage-design)
11. [Dashboard Application](#11-dashboard-application)
12. [Development Phases](#12-development-phases)
13. [Pricing Strategy](#13-pricing-strategy)
14. [Success Metrics](#14-success-metrics)
15. [Future Roadmap](#15-future-roadmap)

---

## 1. Executive Summary

**Gotcha** is a developer-first feedback and experimentation platform that bridges the gap between users and builders. It provides an embeddable React component (the "G button") that attaches contextually to any UI element, enabling:

- **Contextual feedback collection** — users comment on specific components, not pages
- **Feature voting** — users vote on proposed features tied to UI elements
- **A/B test feedback** — collect qualitative data alongside quantitative A/B metrics
- **Feature requests** — users suggest improvements in context

**Tagline:** "Turn insights into action."

**Positioning:** Stripe for product feedback — developer-loved, API-first, native-feeling integration.

---

## 2. Problem Statement

### Current Market Pain Points

1. **Feedback is disconnected from context**

   - Tools like Canny, Nolt, and UserVoice collect feedback on separate portals
   - Product teams must manually map feedback to specific features
   - Users often describe features poorly because they're not looking at them

2. **A/B testing lacks qualitative insight**

   - Tools like Optimizely show _what_ performs better, not _why_
   - No native way to ask users about the variant they're seeing

3. **Integration is painful**

   - Enterprise tools require significant setup
   - Most solutions feel bolted-on, not native
   - Limited customization for developer preferences

4. **Segmentation is an afterthought**
   - Most tools don't let you pass arbitrary user metadata
   - You can't easily answer: "What do users aged 25-34 in Dubai think about this feature?"

### The Opportunity

No tool offers **element-level feedback** with **rich user segmentation** in a **developer-native package**. Gotcha fills this gap.

---

## 3. Product Vision

### Core Principles

1. **Developer-first** — Clean API, minimal configuration, excellent TypeScript support
2. **Contextual by default** — Feedback is always tied to a specific element/feature
3. **Flexible metadata** — Developers pass whatever user data matters to them
4. **Non-intrusive UX** — The G button is subtle, native-feeling, customizable
5. **Actionable insights** — Dashboard surfaces patterns, not just raw data

### The "G Button" Concept

A small, circular button with the Gotcha "G" logo that:

- Lives next to any UI element the developer chooses
- Expands on click to reveal feedback options
- Adapts to the mode (vote, feedback, feature-request, A/B)
- Feels native to the host application

### G Button UX Best Practices

To avoid visual clutter, follow these guidelines:

1. **Default to hover-reveal** — `showOnHover={true}` is the recommended default. The button only appears when users hover over the parent element.

2. **Limit density** — Place G buttons on 3-5 key elements per page maximum. Focus on:
   - New or experimental features
   - High-traffic interaction points
   - Features you're actively iterating on

3. **Use sparingly in production** — G buttons are most valuable during:
   - Beta/early access periods
   - A/B tests
   - Post-launch feedback windows (first 2-4 weeks)
   - Consider removing or hiding after collecting sufficient feedback

4. **Strategic placement** — Best locations:
   - Feature cards/sections (not individual buttons)
   - Navigation sections (sidebar, header)
   - Settings/preferences areas
   - Checkout/conversion flows

5. **Avoid** — Don't attach to:
   - Every list item or table row
   - Form inputs directly
   - Elements smaller than the G button itself
   - High-frequency interaction elements (like play/pause)

### Mobile & Touch Support

`showOnHover` doesn't work on touch devices. The SDK detects touch and adjusts behavior:

```typescript
// packages/sdk/src/utils/device.ts
export const isTouchDevice = () =>
  'ontouchstart' in window || navigator.maxTouchPoints > 0;
```

**Touch-specific behavior:**

| `showOnHover` | Desktop | Mobile/Touch |
|---------------|---------|--------------|
| `true` | Show on hover | Always visible (subtle) |
| `false` | Always visible | Always visible |

**Additional touch prop:**

```typescript
interface GotchaProps {
  // ... existing props
  touchBehavior?: 'always-visible' | 'tap-to-reveal'; // default: 'always-visible'
}
```

- `always-visible`: G button is always shown on touch devices (default, recommended)
- `tap-to-reveal`: First tap reveals button, second tap opens modal

**Touch-friendly sizing:**

Minimum touch target is 44x44px (Apple HIG). The `size` prop ensures this:

| Size | Desktop | Mobile |
|------|---------|--------|
| `sm` | 24px | 44px (auto-scaled) |
| `md` | 32px | 44px |
| `lg` | 40px | 48px |

### Accessibility (a11y)

The SDK follows WCAG 2.1 AA guidelines:

**Keyboard Navigation:**
- G button is focusable (`tabindex="0"`)
- `Enter` or `Space` opens modal
- `Escape` closes modal
- Tab cycles through modal elements
- Focus is trapped inside open modal
- Focus returns to G button on close

**ARIA Attributes:**

```tsx
// GotchaButton.tsx
<button
  aria-label="Give feedback on this feature"
  aria-expanded={isOpen}
  aria-haspopup="dialog"
  role="button"
/>

// GotchaModal.tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="gotcha-modal-title"
>
  <h2 id="gotcha-modal-title">{promptText}</h2>
  ...
</div>
```

**Screen Reader Announcements:**

```tsx
// Announce submission states
<div aria-live="polite" className="sr-only">
  {isSubmitted && "Thank you! Your feedback has been submitted."}
  {error && `Error: ${error.message}`}
</div>
```

**Color Contrast:**
- All text meets 4.5:1 contrast ratio minimum
- Focus indicators are clearly visible
- Don't rely on color alone to convey state

**Focus Visible:**

```css
.gotcha-button:focus-visible {
  outline: 2px solid var(--gotcha-primary);
  outline-offset: 2px;
}
```

---

## 4. Target Users

### Primary: Developers

- **Who:** Frontend/full-stack developers building SaaS products
- **Pain:** Existing feedback tools are clunky to integrate
- **Value prop:** `npm install gotcha-feedback` and you're done

### Secondary: Product Managers

- **Who:** PMs at startups and scale-ups (10-500 employees)
- **Pain:** Feedback is scattered, hard to prioritize
- **Value prop:** See exactly which features users want, segmented by user type

### Tertiary: Founders

- **Who:** Technical founders building MVPs
- **Pain:** Need user input fast, can't afford enterprise tools
- **Value prop:** Free tier that scales with them

---

## 5. Competitive Analysis

### Direct Competitors

| Tool             | Pricing            | Strengths                         | Weaknesses                          | Gotcha Differentiation          |
| ---------------- | ------------------ | --------------------------------- | ----------------------------------- | ------------------------------- |
| **Canny**        | $79-399/mo         | Clean UI, public roadmaps         | Separate portal, not contextual     | Element-attached, in-app        |
| **ProductBoard** | $20-80/user/mo     | Enterprise features, integrations | Complex, expensive, not dev-first   | Simple API, transparent pricing |
| **Nolt**         | $29-99/mo          | Simple voting boards              | Basic, not embeddable               | Native component, rich metadata |
| **UserVoice**    | Custom (expensive) | Enterprise-grade                  | Clunky, dated, slow                 | Modern DX, instant setup        |
| **Upvoty**       | $15-75/mo          | Affordable                        | Limited customization               | Full API control                |
| **Hotjar**       | $0-213/mo          | Heatmaps, recordings              | Feedback is generic, not contextual | Element-specific feedback       |

### Adjacent Competitors

| Tool             | Overlap                  | Differentiation                          |
| ---------------- | ------------------------ | ---------------------------------------- |
| **LaunchDarkly** | Feature flags, A/B       | Gotcha adds qualitative layer            |
| **PostHog**      | Analytics, feature flags | Gotcha focuses on feedback collection    |
| **Intercom**     | In-app messaging         | Gotcha is feedback, not support          |
| **Pendo**        | In-app guides, feedback  | Gotcha is dev-first, Pendo is enterprise |

### Pricing Benchmark Summary

- **Free tiers** are standard (up to X responses/month)
- **Mid-tier** ranges from $29-99/month
- **Enterprise** is custom pricing
- **Per-seat pricing** is falling out of favor; usage-based is trending

---

## 6. Core Features

### 6.1 Feedback Modes

#### Mode: `feedback`

- Open text input for qualitative feedback
- Optional rating (1-5 stars, thumbs up/down, or emoji scale)
- User can describe what they're referring to

#### Mode: `vote`

- Binary vote (👍/👎) or weighted (1-10)
- Aggregated results visible (optional, dev-controlled)
- Useful for "Do you like this feature?" prompts

#### Mode: `poll`

- Multiple choice question with 2-6 options
- Developer defines the options array
- Single-select by default, multi-select optional
- Show results after voting (optional, dev-controlled)
- Useful for product validation: "Would you like X?", "Which feature matters most?"

#### Mode: `feature-request`

- Structured input: title + description
- Auto-tagged to the element it's attached to
- Other users can upvote (if public voting enabled)

#### Mode: `ab`

- Tied to an experiment ID
- Captures which variant the user saw
- Collects qualitative feedback on that variant
- Syncs with A/B testing tools (Phase 3)

### 6.2 User Metadata

Developers pass arbitrary user properties:

```typescript
interface GotchaUser {
  id?: string; // Optional: unique user identifier
  [key: string]: string | number | boolean | null | undefined; // Anything else
}

// Example: Authenticated user
user={{
  id: "usr_123",
  age: 28,
  gender: "male",
  location: "Dubai",
  plan: "pro",
  accountAge: 45, // days
  role: "coach"
}}

// Example: Anonymous user (no user prop, or user without id)
// SDK auto-generates anonymous ID stored in localStorage
<Gotcha elementId="pricing-page" mode="feedback" />
```

**Anonymous User Handling:**

When no `user.id` is provided, the SDK:
1. Generates a random anonymous ID: `anon_${crypto.randomUUID()}`
2. Stores it in localStorage: `gotcha_anonymous_id`
3. Reuses the same ID for all subsequent submissions from that browser
4. Allows segmentation by anonymous vs authenticated users in dashboard

```typescript
// packages/sdk/src/utils/anonymous.ts
export function getAnonymousId(): string {
  const STORAGE_KEY = 'gotcha_anonymous_id';
  let id = localStorage.getItem(STORAGE_KEY);

  if (!id) {
    id = `anon_${crypto.randomUUID()}`;
    localStorage.setItem(STORAGE_KEY, id);
  }

  return id;
}
```

All metadata is:

- Indexed for filtering/segmentation in dashboard
- Encrypted at rest
- Never shared or sold

### 6.3 Customization Options

```typescript
interface GotchaProps {
  // Required
  elementId: string; // Unique identifier for this element

  // Optional - User data
  user?: GotchaUser; // User metadata for segmentation

  // Optional - Behavior
  mode?: "feedback" | "vote" | "poll" | "feature-request" | "ab";
  experimentId?: string; // Required if mode is 'ab'
  variant?: string; // Current A/B variant shown to user

  // Optional - Poll mode specific
  options?: string[]; // Required if mode is 'poll' (2-6 options)
  allowMultiple?: boolean; // Allow selecting multiple options (default: false)
  showResults?: boolean; // Show results after voting (default: true)

  // Optional - Appearance
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "inline";
  size?: "sm" | "md" | "lg"; // Button size
  theme?: "light" | "dark" | "auto" | "custom";
  customStyles?: GotchaStyles; // Full style override
  visible?: boolean; // Control visibility programmatically
  showOnHover?: boolean; // Only show when parent is hovered (default: true)
  touchBehavior?: "always-visible" | "tap-to-reveal"; // Mobile behavior (default: "always-visible")

  // Optional - Content
  promptText?: string; // Custom prompt (e.g., "What do you think of this?")
  placeholder?: string; // Input placeholder text
  submitText?: string; // Submit button text
  thankYouMessage?: string; // Post-submission message

  // Optional - Callbacks
  onSubmit?: (response: GotchaResponse) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: GotchaError) => void;
}
```

### 6.4 Dashboard Features

- **Response feed** — Real-time stream of all feedback
- **Element view** — See all feedback for a specific elementId
- **Segmentation** — Filter by any user metadata field
- **Trends** — Track sentiment over time per element
- **Export** — CSV, JSON, or API access
- **Integrations** — Slack, Discord, Linear, Jira (Phase 2+)
- **Team management** — Invite team members, role-based access

---

## 7. Technical Architecture

### 7.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Apps                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Next.js   │  │    React    │  │     Vue     │              │
│  │     App     │  │     App     │  │     App     │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                ┌─────────▼─────────┐                            │
│                │  gotcha-feedback  │                            │
│                │   (npm package)   │                            │
│                └─────────┬─────────┘                            │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           │ HTTPS (REST + WebSocket)
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      Gotcha Backend                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    API Gateway                           │    │
│  │                  (Next.js API Routes)                    │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                            │                                     │
│         ┌──────────────────┼──────────────────┐                 │
│         │                  │                  │                 │
│  ┌──────▼──────┐   ┌───────▼───────┐  ┌──────▼──────┐          │
│  │  Feedback   │   │     Auth      │  │  Analytics  │          │
│  │   Service   │   │    Service    │  │   Service   │          │
│  └──────┬──────┘   └───────┬───────┘  └──────┬──────┘          │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            │                                     │
│                   ┌────────▼────────┐                           │
│                   │    PostgreSQL   │                           │
│                   │    (Primary)    │                           │
│                   └────────┬────────┘                           │
│                            │                                     │
│                   ┌────────▼────────┐                           │
│                   │     Redis       │                           │
│                   │  (Cache/Queue)  │                           │
│                   └─────────────────┘                           │
└──────────────────────────────────────────────────────────────────┘
                           │
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    Gotcha Dashboard                              │
│                   (gotcha.cx)                                   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Next.js 14 App Router                       │    │
│  │         (React Server Components + Client)               │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 Technology Stack

#### SDK Package (`gotcha-feedback`)

- **Language:** TypeScript (strict mode)
- **Build:** tsup (ESM + CJS output)
- **Framework support:** React 18+ (primary), Vue adapter (Phase 2), Vanilla JS (Phase 3)
- **Size budget:** <15KB gzipped
- **Dependencies:** Minimal (only peer deps: react, react-dom)

#### Backend + Dashboard (`gotcha-app`)

- **Framework:** Next.js 14 (App Router)
- **Runtime:** Node.js 20 LTS
- **Database:** PostgreSQL 15 (Supabase)
- **ORM:** Prisma (with Prisma Accelerate for connection pooling)
- **Auth:** Supabase Auth
- **Hosting:** Netlify
- **UI:** shadcn/ui + Tailwind CSS
- **Charts:** Tremor
- **Tables:** TanStack Table
- **State:** Zustand (minimal) + React Query
- **Real-time:** Supabase Realtime (Phase 2)

**Why Supabase for DB + Auth + Realtime?**

- Single dashboard, single vendor, single bill
- Row Level Security available if needed later
- 50k MAU free tier for auth
- Built-in realtime subscriptions (no extra setup)
- Postgres = you own your data, can migrate anytime

### 7.3 Project Structure (Monorepo)

Use a monorepo with Turborepo to keep SDK and API in sync:

```
gotcha/
├── apps/
│   └── web/                      # Dashboard + API (Next.js)
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   └── signup/page.tsx
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx
│       │   │   ├── dashboard/page.tsx
│       │   │   └── projects/
│       │   │       └── [slug]/
│       │   │           ├── page.tsx
│       │   │           ├── responses/page.tsx
│       │   │           ├── elements/page.tsx
│       │   │           └── settings/page.tsx
│       │   ├── api/
│       │   │   └── v1/
│       │   │       ├── responses/route.ts
│       │   │       ├── elements/route.ts
│       │   │       └── projects/route.ts
│       │   └── page.tsx
│       ├── components/
│       │   ├── layout/
│       │   ├── dashboard/
│       │   ├── responses/
│       │   └── ui/
│       ├── lib/
│       │   ├── prisma.ts
│       │   ├── supabase/
│       │   └── utils.ts
│       ├── prisma/
│       │   └── schema.prisma
│       ├── netlify.toml
│       └── package.json
│
├── packages/
│   ├── sdk/                      # npm package (gotcha-feedback)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   │   ├── GotchaProvider.tsx
│   │   │   │   ├── Gotcha.tsx
│   │   │   │   ├── GotchaButton.tsx
│   │   │   │   ├── GotchaModal.tsx
│   │   │   │   └── modes/
│   │   │   │       ├── FeedbackMode.tsx
│   │   │   │       └── VoteMode.tsx
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── styles/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   │
│   └── shared/                   # Shared types & utilities
│       ├── src/
│       │   ├── types.ts          # API contract types (shared)
│       │   └── constants.ts
│       └── package.json
│
├── turbo.json                    # Turborepo config
├── package.json                  # Root package.json
├── pnpm-workspace.yaml
└── README.md
```

**Why monorepo with Turborepo:**

- **Single source of truth** — API contract types live in `packages/shared`, used by both SDK and API
- **Atomic changes** — Update SDK and API together in one PR
- **Version sync** — When API changes, SDK updates in the same commit
- **Minimal overhead** — Turborepo setup is ~10 lines of config
- **npm publish still works** — `packages/sdk` publishes independently

**Version Discipline:**

```json
// packages/shared/src/types.ts
// This file defines the API contract. Both SDK and API import from here.
// Breaking changes here = major version bump for SDK.

export interface SubmitResponsePayload {
  elementId: string;
  mode: ResponseMode;
  // ... all fields defined once
}
```

**Tooling:**

- **Package manager:** pnpm (required for Turborepo workspaces)
- **Build orchestration:** Turborepo
- **Linting:** ESLint + Prettier
- **Testing:** Vitest (unit), Playwright (e2e)
- **CI/CD:** GitHub Actions → Netlify

---

## 8. Database Schema

### 8.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ORGANIZATION & AUTH
// ============================================

model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  members     OrganizationMember[]
  projects    Project[]
  subscription Subscription?

  @@index([slug])
}

model OrganizationMember {
  id             String       @id @default(cuid())
  organizationId String
  userId         String
  role           MemberRole   @default(MEMBER)
  createdAt      DateTime     @default(now())

  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
  @@index([userId])
}

enum MemberRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  avatarUrl     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  memberships   OrganizationMember[]

  @@index([email])
}

// ============================================
// PROJECTS & API KEYS
// ============================================

model Project {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  slug           String
  description    String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Settings
  settings       Json     @default("{}")

  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  apiKeys        ApiKey[]
  elements       Element[]
  responses      Response[]
  experiments    Experiment[]

  @@unique([organizationId, slug])
  @@index([organizationId])
}

model ApiKey {
  id             String    @id @default(cuid())
  projectId      String
  name           String    // e.g., "Production", "Development"
  key            String    @unique // gtch_live_xxx or gtch_test_xxx
  keyHash        String    // For secure lookup
  allowedDomains String[]  // ["*.myapp.com", "localhost:*"] for origin validation
  lastUsedAt     DateTime?
  createdAt      DateTime  @default(now())
  revokedAt      DateTime?

  // Relations
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([keyHash])
  @@index([projectId])
}

// ============================================
// ELEMENTS & FEEDBACK
// ============================================

model Element {
  id          String   @id @default(cuid())
  projectId   String
  elementId   String   // Developer-provided identifier
  name        String?  // Optional friendly name
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  responses   Response[]

  @@unique([projectId, elementId])
  @@index([projectId])
}

model Response {
  id           String       @id @default(cuid())
  projectId    String
  elementId    String?      // FK to Element
  elementIdRaw String       // Original elementId string (for unregistered elements)

  // Response data
  mode         ResponseMode
  content      String?      // Text feedback or feature request description
  title        String?      // For feature requests
  rating       Int?         // 1-5 or 1-10
  vote         VoteType?    // For vote mode

  // Poll specific
  pollOptions  Json?        // Array of options that were presented
  pollSelected Json?        // Array of selected option(s) - indexes or values

  // A/B specific
  experimentId String?
  variant      String?

  // User data (flexible JSON for arbitrary metadata)
  endUserId    String?      // The ID passed by developer
  endUserMeta  Json         @default("{}")

  // Context
  url          String?      // Page URL where feedback was given
  userAgent    String?

  // Timestamps
  createdAt    DateTime     @default(now())

  // Relations
  project      Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  element      Element?     @relation(fields: [elementId], references: [id], onDelete: SetNull)
  experiment   Experiment?  @relation(fields: [experimentId], references: [id], onDelete: SetNull)

  @@index([projectId])
  @@index([elementId])
  @@index([projectId, elementIdRaw])
  @@index([experimentId])
  @@index([createdAt])
  @@index([endUserId])
}

enum ResponseMode {
  FEEDBACK
  VOTE
  POLL
  FEATURE_REQUEST
  AB
}

enum VoteType {
  UP
  DOWN
}

// ============================================
// A/B EXPERIMENTS
// ============================================

model Experiment {
  id          String   @id @default(cuid())
  projectId   String
  experimentId String  // Developer-provided identifier
  name        String
  description String?
  variants    Json     // Array of variant names
  status      ExperimentStatus @default(DRAFT)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  startedAt   DateTime?
  endedAt     DateTime?

  // Relations
  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  responses   Response[]

  @@unique([projectId, experimentId])
  @@index([projectId])
}

enum ExperimentStatus {
  DRAFT
  RUNNING
  PAUSED
  COMPLETED
}

// ============================================
// BILLING
// ============================================

model Subscription {
  id               String   @id @default(cuid())
  organizationId   String   @unique
  stripeCustomerId String?
  stripePriceId    String?
  stripeSubId      String?
  plan             Plan     @default(FREE)
  status           SubStatus @default(ACTIVE)
  currentPeriodEnd DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Usage tracking
  responsesThisMonth Int @default(0)
  responsesResetAt   DateTime?

  // Relations
  organization     Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([stripeCustomerId])
}

enum Plan {
  FREE
  STARTER
  PRO
  ENTERPRISE
}

enum SubStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
}
```

### 8.2 Indexes for Performance

Key query patterns and their indexes:

| Query Pattern            | Index                              |
| ------------------------ | ---------------------------------- |
| Get responses by project | `@@index([projectId])` on Response |
| Get responses by element | `@@index([elementId])` on Response |
| Filter by date range     | `@@index([createdAt])` on Response |
| Filter by end user       | `@@index([endUserId])` on Response |
| Lookup API key           | `@@index([keyHash])` on ApiKey     |

---

## 9. API Specification

### 9.1 Base URL

- **Production:** `https://api.gotcha.cx/v1`
- **Staging:** `https://api.staging.gotcha.cx/v1`

### 9.2 Authentication

All SDK requests include the API key in the header:

```
Authorization: Bearer gtch_live_xxxxxxxxxxxxx
```

Dashboard uses session-based auth via Supabase Auth.

### 9.2.1 API Key Security (Domain Allowlisting)

API keys are exposed client-side in the browser. To prevent key theft, each API key has an allowed domains list:

```typescript
// When creating an API key in dashboard
{
  name: "Production",
  allowedDomains: ["*.myapp.com", "myapp.com"]
}

// For development
{
  name: "Development",
  allowedDomains: ["localhost:*", "127.0.0.1:*"]
}
```

**Server-side validation:**

```typescript
// apps/web/app/api/v1/middleware.ts

function validateOrigin(request: Request, apiKey: ApiKey): boolean {
  const origin = request.headers.get('origin');

  // Allow requests with no origin (server-to-server, Postman)
  if (!origin) return true;

  // If no domains configured, allow all (not recommended for production)
  if (!apiKey.allowedDomains?.length) return true;

  return apiKey.allowedDomains.some(pattern => {
    const regex = new RegExp(
      '^https?://' + pattern.replace(/\*/g, '.*').replace(/:\*/g, ':\\d+') + '$'
    );
    return regex.test(origin);
  });
}
```

**API rejects with 403 if origin doesn't match:**

```json
{
  "error": {
    "code": "ORIGIN_NOT_ALLOWED",
    "message": "This API key is not authorized for this domain",
    "status": 403
  }
}
```

### 9.3 Endpoints

#### Submit Response

```
POST /v1/responses
```

**Request Headers:**

```
Authorization: Bearer gtch_live_xxxxx
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000  // Optional but recommended
```

**Idempotency:**

The SDK automatically generates an idempotency key for each submission to prevent duplicates (e.g., user double-clicks submit):

```typescript
// packages/sdk/src/api/client.ts
headers: {
  'Idempotency-Key': crypto.randomUUID()
}
```

- Server dedupes requests with the same key within a 5-minute window
- If duplicate detected, returns the original response (not an error)
- Keys are scoped per API key (different projects can use same idempotency key)

**Request Body:**

```json
{
  "elementId": "pricing-toggle",
  "mode": "feedback",
  "content": "This toggle is confusing",
  "rating": 2,
  "user": {
    "id": "usr_123",
    "age": 28,
    "plan": "pro"
  },
  "context": {
    "url": "https://app.example.com/settings",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response (201):**

```json
{
  "id": "resp_abc123",
  "status": "created",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

**Response (201 - Duplicate):**

```json
{
  "id": "resp_abc123",
  "status": "duplicate",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

#### Submit Vote

```
POST /v1/responses
```

**Request Body:**

```json
{
  "elementId": "new-dashboard",
  "mode": "vote",
  "vote": "up",
  "user": {
    "id": "usr_456"
  }
}
```

#### Submit Feature Request

```
POST /v1/responses
```

**Request Body:**

```json
{
  "elementId": "sidebar-nav",
  "mode": "feature-request",
  "title": "Add keyboard shortcuts",
  "content": "Would love to navigate with Cmd+K",
  "user": {
    "id": "usr_789"
  }
}
```

#### Submit A/B Feedback

```
POST /v1/responses
```

**Request Body:**

```json
{
  "elementId": "checkout-flow",
  "mode": "ab",
  "experimentId": "exp_checkout_v2",
  "variant": "B",
  "content": "The new flow is much clearer",
  "rating": 5,
  "user": {
    "id": "usr_101"
  }
}
```

#### Submit Poll Response

```
POST /v1/responses
```

**Request Body:**

```json
{
  "elementId": "gps-tracking-player-profile",
  "mode": "poll",
  "pollOptions": [
    "Yes, definitely",
    "Maybe, tell me more",
    "Not interested",
    "Privacy concerns"
  ],
  "pollSelected": ["Yes, definitely"],
  "user": {
    "id": "usr_202",
    "role": "coach",
    "location": "UAE",
    "league": "DAFL"
  }
}
```

**Response (201):**

```json
{
  "id": "resp_poll_xyz",
  "status": "created",
  "createdAt": "2025-01-15T14:00:00Z",
  "results": {
    "Yes, definitely": 47,
    "Maybe, tell me more": 23,
    "Not interested": 12,
    "Privacy concerns": 8
  }
}
```

#### Get Element Stats (Dashboard)

```
GET /v1/elements/:elementId/stats
```

**Response (200):**

```json
{
  "elementId": "pricing-toggle",
  "totalResponses": 142,
  "averageRating": 3.4,
  "voteBreakdown": {
    "up": 89,
    "down": 53
  },
  "topSegments": [
    { "key": "plan", "value": "free", "count": 67 },
    { "key": "plan", "value": "pro", "count": 45 }
  ],
  "recentTrend": "declining" // or "improving", "stable"
}
```

#### List Responses (Dashboard)

```
GET /v1/responses
```

**Query Parameters:**

- `elementId` — Filter by element
- `mode` — Filter by mode
- `startDate` / `endDate` — Date range
- `user.[key]` — Filter by user metadata (e.g., `user.plan=pro`)
- `page` / `limit` — Pagination

**Response (200):**

```json
{
  "data": [
    {
      "id": "resp_abc123",
      "elementId": "pricing-toggle",
      "mode": "feedback",
      "content": "This toggle is confusing",
      "rating": 2,
      "user": { "id": "usr_123", "age": 28, "plan": "pro" },
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "hasMore": true
  }
}
```

#### Delete User Data (GDPR Compliance)

```
DELETE /v1/users/:userId
```

Deletes all responses and associated data for a specific end user. Required for GDPR "right to erasure" compliance.

**Request:**

```
DELETE /v1/users/usr_123
Authorization: Bearer gtch_live_xxxxx
```

**Response (200):**

```json
{
  "status": "deleted",
  "userId": "usr_123",
  "responsesDeleted": 47,
  "deletedAt": "2025-01-15T12:00:00Z"
}
```

**Response (404):**

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "No responses found for this user ID",
    "status": 404
  }
}
```

**Notes:**
- This is an irreversible operation
- Deletes from all projects under the API key's organization
- Also works for anonymous IDs (`anon_xxx`)
- Dashboard includes a "Delete User Data" button in settings

#### Export User Data (GDPR Compliance)

```
GET /v1/users/:userId/export
```

Exports all data for a user in JSON format. Required for GDPR "right to data portability."

**Response (200):**

```json
{
  "userId": "usr_123",
  "exportedAt": "2025-01-15T12:00:00Z",
  "responses": [
    {
      "id": "resp_abc123",
      "elementId": "pricing-toggle",
      "mode": "feedback",
      "content": "This toggle is confusing",
      "createdAt": "2025-01-10T10:30:00Z"
    }
    // ... all responses
  ],
  "metadata": {
    "age": 28,
    "plan": "pro"
    // ... all metadata ever submitted
  }
}
```

### 9.4 Error Responses

```json
{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The provided API key is invalid or revoked",
    "status": 401
  }
}
```

| Code                 | Status | Description                       |
| -------------------- | ------ | --------------------------------- |
| `INVALID_API_KEY`    | 401    | API key missing or invalid        |
| `ORIGIN_NOT_ALLOWED` | 403    | Domain not in API key allowlist   |
| `RATE_LIMITED`       | 429    | Too many requests                 |
| `QUOTA_EXCEEDED`     | 403    | Monthly response limit reached    |
| `INVALID_REQUEST`    | 400    | Malformed request body            |
| `USER_NOT_FOUND`     | 404    | No data found for user ID (GDPR)  |
| `INTERNAL_ERROR`     | 500    | Server error                      |

### 9.5 Rate Limits

| Plan | Requests/minute | Responses/month |
| ---- | --------------- | --------------- |
| Free | 60              | 500             |
| Pro  | 300             | Unlimited       |

**Implementation (Upstash Redis):**

Use Upstash Redis from day one. In-memory rate limiting doesn't work with serverless (each function instance has its own memory). Upstash has a generous free tier (10k requests/day) and `@upstash/ratelimit` handles all the complexity:

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiters for each plan
export const rateLimiters = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: true,
    prefix: "gotcha:ratelimit:free",
  }),
  starter: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(120, "1 m"),
    analytics: true,
    prefix: "gotcha:ratelimit:starter",
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, "1 m"),
    analytics: true,
    prefix: "gotcha:ratelimit:pro",
  }),
};

export async function checkRateLimit(
  apiKey: string,
  plan: "free" | "starter" | "pro" = "free"
) {
  const limiter = rateLimiters[plan];
  const { success, remaining, reset } = await limiter.limit(apiKey);

  return {
    success,
    remaining,
    resetAt: new Date(reset),
  };
}
```

**Usage in API route:**

```typescript
// app/api/v1/responses/route.ts
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const apiKey = req.headers.get("authorization")?.replace("Bearer ", "");

  const { success, remaining } = await checkRateLimit(apiKey, plan);

  if (!success) {
    return Response.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      {
        status: 429,
        headers: { "X-RateLimit-Remaining": remaining.toString() },
      }
    );
  }

  // ... handle request
}
```

**Why Upstash from MVP:**

- Free tier covers 10k requests/day (plenty for MVP)
- Works correctly with serverless (shared state across instances)
- Built-in analytics dashboard
- ~2ms latency (negligible)
- No Redis server to manage

---

## 10. SDK/Package Design

### 10.1 Package Structure

See Section 7.3 for the full `gotcha-sdk` directory structure.

**Key files:**

- `src/index.ts` — Main exports
- `src/components/Gotcha.tsx` — Main component
- `src/components/GotchaProvider.tsx` — Context provider
- `src/types/index.ts` — TypeScript definitions

### 10.1.1 Network Resilience (Retry Logic)

The SDK includes automatic retry with exponential backoff for failed requests:

```typescript
// packages/sdk/src/api/client.ts

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 500,
  maxDelayMs: 5000,
};

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Don't retry client errors (4xx) except 429 (rate limit)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }

      // Retry server errors (5xx) and rate limits (429)
      if (response.ok) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      // Network error - retry
      lastError = error as Error;
    }

    // Don't delay after last attempt
    if (attempt < config.maxRetries) {
      const delay = Math.min(
        config.baseDelayMs * Math.pow(2, attempt),
        config.maxDelayMs
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

**Retry behavior:**

| Error Type | Retries? | Notes |
|------------|----------|-------|
| Network failure | Yes | Connection timeout, DNS failure |
| 5xx Server error | Yes | Server issues |
| 429 Rate limited | Yes | With backoff |
| 4xx Client error | No | Invalid request, bad auth |
| Success (2xx) | No | Return immediately |

**Optional: Offline Queue**

For critical feedback that must not be lost, the SDK can queue failed submissions:

```typescript
// packages/sdk/src/utils/offline-queue.ts

const QUEUE_KEY = 'gotcha_offline_queue';

export function queueForRetry(payload: SubmitPayload): void {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  queue.push({ payload, timestamp: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function processQueue(client: ApiClient): void {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  if (queue.length === 0) return;

  // Process on next idle
  requestIdleCallback(async () => {
    for (const item of queue) {
      try {
        await client.submit(item.payload);
        // Remove from queue on success
      } catch {
        // Keep in queue for next attempt
      }
    }
  });
}

// Call on page load
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => processQueue(client));
}
```

This is **disabled by default** — enable with `<GotchaProvider offlineQueue={true}>`.

### 10.2 Component Implementation

#### GotchaProvider

```tsx
// src/components/GotchaProvider.tsx

import React, { createContext, useContext, useMemo } from "react";
import { GotchaConfig, GotchaContextValue } from "../types";
import { createApiClient } from "../api/client";

const GotchaContext = createContext<GotchaContextValue | null>(null);

export interface GotchaProviderProps {
  apiKey: string;
  children: React.ReactNode;
  baseUrl?: string; // Override API URL
  debug?: boolean; // Enable console logging
  disabled?: boolean; // Disable all Gotcha buttons
  defaultUser?: object; // Default user metadata
}

export function GotchaProvider({
  apiKey,
  children,
  baseUrl = "https://api.gotcha.cx/v1",
  debug = false,
  disabled = false,
  defaultUser = {},
}: GotchaProviderProps) {
  const client = useMemo(
    () => createApiClient({ apiKey, baseUrl, debug }),
    [apiKey, baseUrl, debug]
  );

  const value: GotchaContextValue = useMemo(
    () => ({
      client,
      disabled,
      defaultUser,
      debug,
    }),
    [client, disabled, defaultUser, debug]
  );

  return (
    <GotchaContext.Provider value={value}>{children}</GotchaContext.Provider>
  );
}

export function useGotchaContext() {
  const context = useContext(GotchaContext);
  if (!context) {
    throw new Error("useGotchaContext must be used within a GotchaProvider");
  }
  return context;
}
```

#### Main Gotcha Component

```tsx
// src/components/Gotcha.tsx

import React, { useState, useCallback } from "react";
import { GotchaButton } from "./GotchaButton";
import { GotchaModal } from "./GotchaModal";
import { useGotchaContext } from "./GotchaProvider";
import { useSubmit } from "../hooks/useSubmit";
import { GotchaProps, GotchaResponse, ResponseMode } from "../types";

export function Gotcha({
  elementId,
  user,
  mode = "feedback",
  experimentId,
  variant,
  // Poll specific
  options,
  allowMultiple = false,
  showResults = true,
  // Appearance
  position = "top-right",
  size = "md",
  theme = "auto",
  customStyles,
  visible = true,
  showOnHover = true, // Default to hover-reveal to avoid visual clutter
  // Content
  promptText,
  placeholder,
  submitText = "Submit",
  thankYouMessage = "Thanks for your feedback!",
  // Callbacks
  onSubmit,
  onOpen,
  onClose,
  onError,
}: GotchaProps) {
  const { disabled, defaultUser } = useGotchaContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [pollResults, setPollResults] = useState(null);

  // Validate poll mode has options
  if (mode === "poll" && (!options || options.length < 2)) {
    console.warn("[Gotcha] Poll mode requires at least 2 options");
    return null;
  }

  const { submit, isLoading, error } = useSubmit({
    elementId,
    mode: mode as ResponseMode,
    experimentId,
    variant,
    pollOptions: options,
    user: { ...defaultUser, ...user },
    onSuccess: (response) => {
      setIsSubmitted(true);
      if (response.results && showResults) {
        setPollResults(response.results);
      }
      onSubmit?.(response);
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
        setPollResults(null);
      }, 3000);
    },
    onError,
  });

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsSubmitted(false);
    setPollResults(null);
    onClose?.();
  }, [onClose]);

  if (disabled || !visible) return null;

  return (
    <div
      className={`gotcha-container gotcha-position-${position}`}
      data-gotcha-element={elementId}
    >
      <GotchaButton
        size={size}
        theme={theme}
        customStyles={customStyles}
        showOnHover={showOnHover}
        onClick={handleOpen}
        isOpen={isOpen}
      />

      {isOpen && (
        <GotchaModal
          mode={mode}
          theme={theme}
          customStyles={customStyles}
          promptText={promptText}
          placeholder={placeholder}
          submitText={submitText}
          thankYouMessage={thankYouMessage}
          // Poll props
          options={options}
          allowMultiple={allowMultiple}
          showResults={showResults}
          pollResults={pollResults}
          // State
          isLoading={isLoading}
          isSubmitted={isSubmitted}
          error={error}
          onSubmit={submit}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
```

### 10.3 Usage Examples

#### Basic Setup

```tsx
// app/layout.tsx (Next.js)

import { GotchaProvider } from "gotcha-feedback";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <GotchaProvider apiKey={process.env.NEXT_PUBLIC_GOTCHA_KEY!}>
          {children}
        </GotchaProvider>
      </body>
    </html>
  );
}
```

#### Feedback on a Feature

```tsx
// components/PricingToggle.tsx

import { Gotcha } from "gotcha-feedback";

export function PricingToggle({ user }) {
  return (
    <div className="relative">
      <Switch {...props} />

      <Gotcha
        elementId="pricing-toggle"
        mode="feedback"
        user={{
          id: user.id,
          plan: user.plan,
          accountAge: user.daysActive,
        }}
        promptText="What do you think of this pricing toggle?"
        position="top-right"
      />
    </div>
  );
}
```

#### A/B Test Feedback

```tsx
// components/CheckoutFlow.tsx

import { Gotcha } from "gotcha-feedback";

export function CheckoutFlow({ user, variant }) {
  return (
    <div className="checkout">
      {variant === "A" ? <OldCheckout /> : <NewCheckout />}

      <Gotcha
        elementId="checkout-flow"
        mode="ab"
        experimentId="checkout_redesign_jan25"
        variant={variant}
        user={{ id: user.id, totalOrders: user.orderCount }}
        promptText="How was your checkout experience?"
      />
    </div>
  );
}
```

#### Feature Request

```tsx
// components/Sidebar.tsx

import { Gotcha } from "gotcha-feedback";

export function Sidebar({ user }) {
  return (
    <nav className="sidebar">
      {/* nav items */}

      <Gotcha
        elementId="sidebar-navigation"
        mode="feature-request"
        user={{ id: user.id, role: user.role }}
        promptText="Have an idea to improve navigation?"
        position="bottom-right"
      />
    </nav>
  );
}
```

#### Poll for Product Validation (PLAYBACK Example)

```tsx
// components/PlayerProfile.tsx

import { Gotcha } from "gotcha-feedback";

export function PlayerProfile({ user, player }) {
  return (
    <div className="player-profile">
      <PlayerStats player={player} />
      <PerformanceChart player={player} />

      {/* GPS Tracking feature validation */}
      <Gotcha
        elementId="gps-tracking-player-profile"
        mode="poll"
        promptText="Would you like GPS Tracking data in Player Profiles?"
        options={[
          "Yes, definitely",
          "Maybe, tell me more",
          "Not interested",
          "Privacy concerns",
        ]}
        showResults={true}
        user={{
          id: user.id,
          role: user.role, // "coach" | "player" | "parent"
          age: user.age,
          location: user.country, // "UAE" | "UK" | "Kuwait"
          club: user.clubName,
          league: user.leagueName, // "Junior Premier League" | "DAFL"
          accountAge: user.daysActive,
        }}
        position="bottom-right"
      />
    </div>
  );
}
```

#### Poll with Multiple Selection

```tsx
// components/FeaturePrioritization.tsx

import { Gotcha } from "gotcha-feedback";

export function DashboardSettings({ user }) {
  return (
    <div className="settings">
      <Gotcha
        elementId="feature-prioritization-q1"
        mode="poll"
        promptText="Which features matter most to you? (Select up to 3)"
        options={[
          "Live match streaming",
          "AI highlight clips",
          "GPS tracking & heatmaps",
          "Team communication tools",
          "Parent viewing access",
          "College recruitment profiles",
        ]}
        allowMultiple={true}
        showResults={false} // Don't bias responses
        user={{
          id: user.id,
          role: user.role,
          plan: user.subscription,
        }}
      />
    </div>
  );
}
```

### 10.4 TypeScript Types

```typescript
// src/types/index.ts

export type ResponseMode =
  | "feedback"
  | "vote"
  | "poll"
  | "feature-request"
  | "ab";

export type VoteType = "up" | "down";

export type Position =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "inline";

export type Size = "sm" | "md" | "lg";

export type Theme = "light" | "dark" | "auto" | "custom";

export interface GotchaUser {
  id?: string; // Optional - SDK generates anonymous ID if not provided
  [key: string]: string | number | boolean | null | undefined;
}

export interface GotchaStyles {
  button?: React.CSSProperties;
  modal?: React.CSSProperties;
  input?: React.CSSProperties;
  submitButton?: React.CSSProperties;
  pollOption?: React.CSSProperties;
  pollOptionSelected?: React.CSSProperties;
}

export interface GotchaProps {
  // Required
  elementId: string;

  // User data
  user?: GotchaUser;

  // Behavior
  mode?: ResponseMode;
  experimentId?: string;
  variant?: string;

  // Poll mode specific
  options?: string[]; // Required if mode is 'poll' (2-6 options)
  allowMultiple?: boolean; // Allow multi-select (default: false)
  showResults?: boolean; // Show results after voting (default: true)

  // Appearance
  position?: Position;
  size?: Size;
  theme?: Theme;
  customStyles?: GotchaStyles;
  visible?: boolean;
  showOnHover?: boolean; // default: true
  touchBehavior?: "always-visible" | "tap-to-reveal"; // default: "always-visible"

  // Content
  promptText?: string;
  placeholder?: string;
  submitText?: string;
  thankYouMessage?: string;

  // Callbacks
  onSubmit?: (response: GotchaResponse) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: GotchaError) => void;
}

export interface GotchaResponse {
  id: string;
  status: "created";
  createdAt: string;
  results?: PollResults; // Included for poll mode if showResults is true
}

export interface PollResults {
  [option: string]: number; // Option text -> vote count
}

export interface GotchaError {
  code: string;
  message: string;
  status: number;
}

export interface GotchaContextValue {
  client: ApiClient;
  disabled: boolean;
  defaultUser: object;
  debug: boolean;
}
```

---

## 11. Dashboard Application

### 11.1 Information Architecture

```
app.gotcha.cx/
├── /                           # Redirect to /dashboard or /login
├── /login                      # Auth (Clerk)
├── /signup
├── /dashboard                  # Overview: key metrics, recent activity
├── /projects
│   └── /[projectSlug]
│       ├── /                   # Project overview
│       ├── /responses          # All responses (filterable)
│       ├── /elements           # List of elements with stats
│       │   └── /[elementId]    # Element detail view
│       ├── /experiments        # A/B experiments
│       │   └── /[experimentId] # Experiment detail
│       ├── /insights           # AI-generated insights (Phase 3)
│       ├── /settings           # Project settings
│       └── /api-keys           # API key management
├── /settings                   # Account settings
├── /team                       # Team management
└── /billing                    # Subscription management
```

### 11.2 Key Screens

#### Dashboard Home

- **Metrics cards:** Total responses (30d), avg rating, top elements
- **Activity feed:** Real-time stream of incoming feedback
- **Quick filters:** By mode, by sentiment
- **Trend chart:** Responses over time

#### Responses List

- **Table view:** All responses with columns for element, mode, content, user, date
- **Filters sidebar:** Date range, mode, element, user metadata
- **Bulk actions:** Export, archive
- **Quick view:** Click to expand full response details

#### Element Detail

- **Summary stats:** Total responses, avg rating, vote breakdown
- **Sentiment over time:** Line chart
- **Segmentation breakdown:** Bar charts by user metadata
- **Response list:** All responses for this element

#### Experiment Detail

- **Variant comparison:** Side-by-side stats
- **Qualitative feedback:** Grouped by variant
- **Statistical significance:** (Phase 2)

### 11.3 Dashboard Components

Located in `gotcha-app/`:

```
gotcha-app/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Sidebar + header
│   │   ├── dashboard/page.tsx
│   │   └── projects/
│   │       └── [slug]/
│   │           ├── page.tsx
│   │           ├── responses/page.tsx
│   │           ├── elements/page.tsx
│   │           └── settings/page.tsx
│   ├── api/
│   │   └── v1/                 # API routes
│   └── page.tsx                # Marketing landing
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── ProjectSwitcher.tsx
│   ├── dashboard/
│   │   ├── MetricsCards.tsx
│   │   ├── ActivityFeed.tsx
│   │   └── TrendChart.tsx
│   ├── responses/
│   │   ├── ResponsesTable.tsx
│   │   ├── ResponseFilters.tsx
│   │   └── ResponseDetail.tsx
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── prisma.ts               # Prisma client
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── middleware.ts       # Auth middleware
│   └── utils.ts
└── prisma/
    └── schema.prisma
```

---

## 12. Development Phases

### Phase 1: Foundation (Weeks 1-3)

**Goal:** Working MVP with feedback + vote modes, dogfooded in PLAYBACK

**MVP Scope (2 modes only):**
- ✅ `feedback` — Text input + optional rating
- ✅ `vote` — Up/down voting
- ❌ `poll` — Deferred to Phase 2
- ❌ `feature-request` — Deferred to Phase 2
- ❌ `ab` — Deferred to Phase 2

*Rationale: Feedback and vote cover 80% of use cases. Ship fast, validate, then expand.*

#### Week 1: Monorepo Setup + SDK Core

- [ ] Create `gotcha` monorepo with Turborepo
- [ ] Set up pnpm workspaces (`apps/web`, `packages/sdk`, `packages/shared`)
- [ ] Configure TypeScript + tsup for SDK
- [ ] Define shared types in `packages/shared`
- [ ] Implement `GotchaProvider` component
- [ ] Implement `Gotcha` component (feedback mode)
- [ ] Implement `GotchaButton` (the G button, with `showOnHover` default)
- [ ] Implement `GotchaModal` with feedback mode
- [ ] Create API client with error handling
- [ ] Test locally with a Next.js app

#### Week 2: Backend + Database

- [ ] Set up Next.js 14 with App Router in `apps/web`
- [ ] Create Supabase project
- [ ] Create Upstash Redis project (for rate limiting)
- [ ] Configure Prisma with Supabase PostgreSQL
- [ ] Run Prisma migrations for core models
- [ ] Set up Supabase Auth (email + OAuth providers)
- [ ] Implement API key generation logic
- [ ] Create `POST /api/v1/responses` endpoint (feedback + vote)
- [ ] Create `GET /api/v1/responses` endpoint
- [ ] Add request validation (Zod)
- [ ] Add Upstash rate limiting

#### Week 3: Vote Mode + Dashboard + Deployment

- [ ] Implement vote mode in SDK
- [ ] Build project creation flow
- [ ] Build API key management UI
- [ ] Create basic responses list view
- [ ] Add filtering (date, mode, element)
- [ ] Configure `netlify.toml`
- [ ] Set up Prisma Accelerate for connection pooling
- [ ] Deploy to Netlify
- [ ] Publish SDK to npm (private or scoped initially)
- [ ] Integrate into PLAYBACK for dogfooding

**Deliverable:** Installable npm package with feedback + vote, working API, basic dashboard

---

### Phase 2: Additional Modes (Weeks 4-7)

**Goal:** All five modes working, polished dashboard

#### Week 4: Poll + Feature Request Modes

- [ ] Implement poll mode (single/multi-select)
- [ ] Implement feature request mode (title + description)
- [ ] Add poll results visualization in dashboard
- [ ] Add feature request list view in dashboard
- [ ] Update API to handle poll + feature-request modes

#### Week 5: A/B Mode + Experiments

- [ ] Implement A/B mode in SDK
- [ ] Add experiment management in dashboard
- [ ] Create experiment detail view (variant comparison)
- [ ] Update API to handle A/B mode

#### Week 5: Dashboard Enhancement

- [ ] Build element-level views
- [ ] Add user metadata filtering
- [ ] Create trend charts with Tremor:

  ```tsx
  import { BarChart, LineChart, DonutChart } from '@tremor/react'

  // Poll results
  <BarChart data={pollData} index="option" categories={["votes"]} />

  // Responses over time
  <LineChart data={timeData} index="date" categories={["responses"]} />

  // Mode breakdown
  <DonutChart data={modeData} index="mode" category="count" />
  ```

- [ ] Implement real-time updates (Supabase Realtime)
- [ ] Add export functionality (CSV, JSON)

#### Week 6: SDK Polish

- [ ] Add theming support (light/dark/auto)
- [ ] Implement `showOnHover` behavior
- [ ] Create customStyles API
- [ ] Add animation/transitions
- [ ] Optimize bundle size (<15KB gzipped)

#### Week 7: Testing & Docs

- [ ] Write unit tests (Vitest)
- [ ] Write integration tests (Playwright)
- [ ] Create documentation site (Nextra or Mintlify)
- [ ] Write getting started guide
- [ ] Create API reference
- [ ] Add inline JSDoc comments

**Deliverable:** Feature-complete SDK, polished dashboard, documentation

---

### Phase 3: Growth Features (Weeks 8-11)

**Goal:** Integrations, analytics, billing

#### Week 8: Integrations

- [ ] Slack integration (new feedback notifications)
- [ ] Discord integration
- [ ] Linear integration (create issues from feedback)
- [ ] Webhook support (generic)

#### Week 9: Analytics & Insights

- [ ] Sentiment analysis (basic NLP or API)
- [ ] Trend detection
- [ ] Segmentation insights
- [ ] AI-powered summaries (optional, OpenAI)

#### Week 10: Billing & Usage

- [x] Stripe integration
- [x] Usage tracking and limits
- [x] Plan management UI
- [x] Upgrade/downgrade flows
- [ ] Invoice history

#### Week 11: Launch Prep

- [x] Marketing site (gotcha.cx)
- [ ] Product Hunt assets
- [ ] Blog post / announcement
- [ ] Social media content
- [ ] Beta user outreach
- [x] Public npm publish
- [x] AI/LLM optimization (llms.txt, footer AI links)

**Deliverable:** Production-ready SaaS with billing

---

### Phase 4: Scale & Enterprise (Months 4-6)

**Goal:** Enterprise features, additional frameworks

- [ ] Vue adapter
- [ ] Vanilla JS adapter
- [ ] SSO/SAML support
- [ ] Audit logs
- [ ] Advanced permissions
- [ ] Custom domains
- [ ] On-premise deployment option
- [ ] SOC 2 compliance groundwork

---

## 13. Pricing Strategy

### 13.1 Pricing Tiers (Simplified)

| Feature               | Free      | Pro         |
| --------------------- | --------- | ----------- |
| **Monthly price**     | $0        | $29         |
| **Responses/month**   | 500       | Unlimited   |
| **Projects**          | 1         | Unlimited   |
| **Data retention**    | 30 days   | Unlimited   |
| **Modes**             | All       | All         |
| **Analytics**         | Basic     | Full        |
| **Export**            | —         | CSV         |

*Note: Simplified from original 4-tier model (Free/Starter/Pro/Enterprise) to 2 tiers for launch. Enterprise tier may be added later based on demand.*

### 13.2 Pricing Rationale

- **Free tier is generous** — 500 responses covers most early-stage startups, builds habit
- **No per-seat pricing** — Follows modern trend (Vercel, Supabase), reduces friction
- **Simple choice** — Two tiers reduces decision fatigue
- **Pro is the target** — $29/mo is impulse-buy territory for indie devs and small teams
- **Unlimited responses on Pro** — Clear value proposition, no usage anxiety

### 13.3 Competitor Price Comparison

| Tool         | Entry Price | Mid Tier    | Notes                         |
| ------------ | ----------- | ----------- | ----------------------------- |
| Canny        | $79/mo      | $359/mo     | Per-seat for higher tiers     |
| ProductBoard | $20/user/mo | $80/user/mo | Gets expensive with team size |
| Nolt         | $29/mo      | $99/mo      | Simple flat pricing           |
| Hotjar       | $0          | $213/mo     | Session-based                 |
| Upvoty       | $15/mo      | $75/mo      | Lower end                     |

**Gotcha positioning:** Premium to Upvoty/Nolt, competitive with Canny, undercuts ProductBoard for teams.

---

## 14. Success Metrics

### 14.1 North Star Metric

**Monthly Active Responses (MAR)** — Total feedback responses submitted across all customers

### 14.2 Key Metrics by Phase

#### Phase 1 (MVP — Week 3)

- SDK successfully installed in PLAYBACK
- 100+ test responses collected
- <200ms API response time
- Deployed and running on Netlify

#### Phase 2 (Core — Week 7)

- 10 beta users
- 1,000+ responses collected
- All 5 modes working
- NPS from beta users > 40

#### Phase 3 (Launch — Week 11)

- 100 npm downloads/week
- 50 active projects
- 5 paying customers
- <1% API error rate

#### Phase 4 (Growth — Month 6+)

- 1,000 npm downloads/week
- 500 active projects
- 100 paying customers
- $10k MRR

### 14.3 Health Metrics

- **Activation rate:** % of signups that submit first response
- **Retention:** % of active projects after 30/60/90 days
- **Expansion:** Avg responses per project over time
- **Churn:** Monthly customer churn rate

---

## 15. Future Roadmap

### Near-term (6-12 months)

- **SDK:** Vue, Svelte, Vanilla JS adapters
- **Mobile:** React Native component
- **Analytics:** Advanced segmentation, cohort analysis
- **AI:** Automatic categorization, sentiment, summaries
- **Integrations:** Jira, Notion, GitHub Issues

### Medium-term (1-2 years)

- **Session replay integration:** Partner with LogRocket/FullStory
- **A/B platform integration:** LaunchDarkly, Split.io sync
- **Public roadmap builder:** Canny-style public voting pages
- **Embeddable widgets:** Beyond the G button
- **Localization:** Multi-language SDK

### Long-term (2+ years)

- **Platform:** Marketplace for feedback integrations
- **Enterprise:** On-premise, air-gapped deployments
- **Predictive:** ML to predict user churn/satisfaction
- **Industry verticals:** Gaming, healthcare compliance

---

## Appendix A: Claude Code Instructions

When using this document with Claude Code, reference specific sections:

```
"Implement the GotchaProvider component as specified in Section 10.2"

"Create the Prisma schema from Section 8.1"

"Build the POST /api/v1/responses endpoint from Section 9.3"

"Set up the gotcha-app structure from Section 7.3"
```

### Recommended Claude Code Workflow

1. **Start with SDK:** Build the npm package first so you can test locally
2. **Build API endpoints:** Create the backend routes as you need them
3. **Add database:** Set up Prisma schema and run migrations
4. **Dashboard last:** Build the UI once SDK and API are stable
5. **Deploy:** Configure Netlify and ship

### Key Files to Generate First

**For gotcha-sdk:**

1. `package.json` — SDK package config with tsup
2. `src/components/GotchaProvider.tsx` — Entry point
3. `src/components/Gotcha.tsx` — Main component
4. `src/types/index.ts` — TypeScript types

**For gotcha-app:**

1. `netlify.toml` — Netlify configuration
2. `prisma/schema.prisma` — Database schema
3. `lib/prisma.ts` — Prisma client with Accelerate
4. `lib/supabase/server.ts` — Supabase server client
5. `app/api/v1/responses/route.ts` — Core API endpoint
6. `middleware.ts` — Supabase Auth middleware

### Example Claude Code Prompts

```
"Create a new gotcha-sdk repository with TypeScript, tsup for building,
and the GotchaProvider component from Section 10.2"

"Set up the gotcha-app Next.js project with the Prisma schema from
Section 8.1, configured for Netlify deployment"

"Implement the POST /api/v1/responses endpoint that handles all five
modes (feedback, vote, poll, feature-request, ab) from Section 9.3"

"Build the dashboard responses list page with filtering by date, mode,
and element as described in Section 11.2"
```

---

## Appendix B: Netlify Configuration

### netlify.toml

```toml
[build]
  command = "npm run build"
  publish = ".next"

# Next.js plugin for Netlify
[[plugins]]
  package = "@netlify/plugin-nextjs"

# Environment variables (set in Netlify dashboard, not here)
[build.environment]
  NODE_VERSION = "20"

# Headers for API routes
[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization"

# Redirects for SPA routing (handled by Next.js, but backup)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  conditions = {Role = ["admin"]}
```

### Netlify Functions Timeout

For API routes that might take longer (e.g., bulk operations), extend the timeout in your API route:

```typescript
// app/api/v1/responses/route.ts

export const config = {
  maxDuration: 25, // seconds (Pro plan allows up to 26s)
};
```

### Prisma on Netlify

Serverless environments create many short-lived database connections. Use Prisma Accelerate for connection pooling:

```typescript
// lib/prisma.ts

import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient().$extends(withAccelerate());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Supabase Auth Setup

```typescript
// lib/supabase/server.ts

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component
          }
        },
      },
    }
  );
}
```

```typescript
// lib/supabase/client.ts

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// middleware.ts

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect dashboard routes
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*"],
};
```

---

## Appendix C: Environment Variables

### SDK (Client-side, in consuming app)

```env
NEXT_PUBLIC_GOTCHA_KEY=gtch_live_xxxxx
```

### apps/web (Netlify environment variables)

```env
# Database (use Prisma Accelerate URL for connection pooling)
DATABASE_URL=prisma://accelerate.prisma-data.net/?api_key=xxxxx
DIRECT_DATABASE_URL=postgresql://user:pass@host:5432/gotcha

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxx

# Stripe (Phase 3)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# App URLs
NEXT_PUBLIC_APP_URL=https://app.gotcha.cx
NEXT_PUBLIC_API_URL=https://app.gotcha.cx/api/v1
```

### Setting Environment Variables in Netlify

1. Go to **Site settings** → **Environment variables**
2. Add each variable above
3. Choose scope: **Production**, **Preview**, or **All**

For sensitive keys (SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY), use Netlify's sensitive variable option to hide values in logs.

---

## Appendix C: Design Tokens

```css
:root {
  /* Colors - G Button */
  --gotcha-button-bg: #c7d2dc; /* Light blue-grey */
  --gotcha-button-hover: #b0bec9; /* Slightly darker on hover */
  --gotcha-button-icon: #4b5563; /* Dark grey "G" icon */

  /* Colors - Modal/UI */
  --gotcha-primary: #6366f1; /* Indigo-500 (submit buttons, accents) */
  --gotcha-primary-hover: #4f46e5; /* Indigo-600 */
  --gotcha-bg-light: #ffffff;
  --gotcha-bg-dark: #1f2937;
  --gotcha-text-light: #111827;
  --gotcha-text-dark: #f9fafb;
  --gotcha-border-light: #e5e7eb;
  --gotcha-border-dark: #374151;

  /* Sizing */
  --gotcha-button-sm: 24px;
  --gotcha-button-md: 32px;
  --gotcha-button-lg: 40px;
  --gotcha-modal-width: 320px;
  --gotcha-border-radius: 8px;

  /* Animation */
  --gotcha-transition: 150ms ease;
}
```

**G Button visual:**

```
┌─────────────────────────────────┐
│                                 │
│   [ G ]  ← Light blue-grey      │
│    ↑       (#C7D2DC)            │
│    Dark grey icon (#4B5563)     │
│                                 │
└─────────────────────────────────┘
```

---

_End of Document_
