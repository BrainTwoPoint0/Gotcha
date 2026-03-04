# Feature Implementation Plans

> Detailed implementation specs for each new feature. Work through these one by one.

---

## Table of Contents

1. [Webhooks/API for Responses](#1-webhooks-api-for-responses)
2. [Slack/Discord Notifications](#2-slack-discord-notifications)
3. [Response Tagging/Status](#3-response-tagging-status)
4. [NPS Mode](#4-nps-mode)
5. [AI Feedback Summaries](#5-ai-feedback-summaries)
6. [Embeddable Score Component](#6-embeddable-score-component)
7. [Element-Level Analytics Dashboard](#7-element-level-analytics-dashboard)
8. [Bug Flagging & Ticket Tracking](#8-bug-flagging--ticket-tracking)

---

## 1. Webhooks/API for Responses

**Goal:** Let developers receive real-time notifications when new feedback comes in, enabling custom workflows, Zapier, Slack bots, and data pipelines.

**Effort:** ~3-4 days | **Impact:** HIGH | **Plan:** PRO only

### Database Changes

Add to `prisma/schema.prisma`:

```prisma
model Webhook {
  id             String   @id @default(cuid())
  projectId      String
  project        Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  url            String   // The endpoint to POST to
  secret         String   // HMAC signing secret (SHA-256)
  events         String[] // e.g. ["response.created", "response.updated"]
  active         Boolean  @default(true)
  description    String?
  lastTriggeredAt DateTime?
  lastStatusCode Int?     // Last HTTP status received
  failureCount   Int      @default(0) // Consecutive failures
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([projectId])
}

model WebhookLog {
  id          String   @id @default(cuid())
  webhookId   String
  webhook     Webhook  @relation(fields: [webhookId], references: [id], onDelete: Cascade)
  event       String
  payload     Json
  statusCode  Int?
  responseMs  Int?     // Response time
  error       String?
  success     Boolean
  createdAt   DateTime @default(now())

  @@index([webhookId, createdAt])
}
```

### Webhook Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `response.created` | New response submitted | Full response object |
| `response.updated` | Response edited by user | Full response + changed fields |

### Webhook Delivery Logic

**File:** `apps/web/lib/webhooks.ts`

```typescript
// Core delivery function
async function deliverWebhook(webhook: Webhook, event: string, payload: object) {
  const timestamp = Date.now().toString();
  const body = JSON.stringify({ event, data: payload, timestamp });

  // HMAC-SHA256 signature
  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(body)
    .digest('hex');

  const start = Date.now();
  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gotcha-Signature': signature,
        'X-Gotcha-Event': event,
        'X-Gotcha-Timestamp': timestamp,
      },
      body,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    await logWebhookDelivery(webhook.id, event, payload, res.status, Date.now() - start, null, res.ok);

    if (!res.ok) {
      await incrementFailureCount(webhook.id);
    } else {
      await resetFailureCount(webhook.id);
    }
  } catch (error) {
    await logWebhookDelivery(webhook.id, event, payload, null, Date.now() - start, error.message, false);
    await incrementFailureCount(webhook.id);
  }
}

// Auto-disable after 10 consecutive failures
async function incrementFailureCount(webhookId: string) {
  const webhook = await prisma.webhook.update({
    where: { id: webhookId },
    data: { failureCount: { increment: 1 } },
  });
  if (webhook.failureCount >= 10) {
    await prisma.webhook.update({
      where: { id: webhookId },
      data: { active: false },
    });
    // TODO: Send email notification that webhook was disabled
  }
}
```

### Integration Point

In `apps/web/app/api/v1/responses/route.ts`, after the async DB write block:

```typescript
// After response is created in DB...
// Fire webhooks (non-blocking)
fireWebhooks(projectId, 'response.created', {
  id: responseId,
  elementId,
  mode,
  content,
  rating,
  vote,
  pollSelected,
  user: userData,
  createdAt: new Date().toISOString(),
});
```

`fireWebhooks` fetches all active webhooks for the project with the matching event, then delivers in parallel (fire-and-forget).

### API Endpoints for Managing Webhooks

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/projects/[slug]/webhooks` | Session | List webhooks |
| POST | `/api/projects/[slug]/webhooks` | Session | Create webhook |
| PATCH | `/api/projects/[slug]/webhooks/[id]` | Session | Update webhook |
| DELETE | `/api/projects/[slug]/webhooks/[id]` | Session | Delete webhook |
| GET | `/api/projects/[slug]/webhooks/[id]/logs` | Session | View delivery logs |
| POST | `/api/projects/[slug]/webhooks/[id]/test` | Session | Send test payload |

### Dashboard UI

Add a **Webhooks** tab to the project detail page (`/dashboard/projects/[slug]`):

- List of webhooks with status indicator (green=active, red=failing, gray=disabled)
- "Add Webhook" form: URL, events checkboxes, description
- Webhook detail view: delivery logs table (timestamp, status code, response time, success/fail)
- "Send Test" button that delivers a sample payload
- Auto-generated secret shown once on creation (copyable, never shown again)

### Security

- HMAC-SHA256 signing so receivers can verify authenticity
- 10-second timeout per delivery
- Auto-disable after 10 consecutive failures
- Webhook URLs validated (must be HTTPS in production)
- Secrets are randomly generated 32-byte hex strings

---

## 2. Slack/Discord Notifications

**Goal:** Ping a Slack channel or Discord channel when new feedback arrives. The #1 most requested integration in every feedback tool.

**Effort:** ~3 days | **Impact:** HIGH | **Plan:** PRO only

**Approach:** Build on top of webhooks (Feature 1) using Slack Incoming Webhooks and Discord Webhooks — both are just POST requests to a URL with a specific JSON format. No OAuth needed.

### Database Changes

Add to `prisma/schema.prisma`:

```prisma
model Integration {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  type        IntegrationType
  config      Json     // Channel URL, formatting preferences
  events      String[] // ["response.created"]
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
}

enum IntegrationType {
  SLACK
  DISCORD
}
```

### Config Shape

```typescript
// Slack
interface SlackConfig {
  webhookUrl: string;        // https://hooks.slack.com/services/T.../B.../...
  channel?: string;          // Override channel (optional)
  includeContent: boolean;   // Show feedback text in message (default: true)
}

// Discord
interface DiscordConfig {
  webhookUrl: string;        // https://discord.com/api/webhooks/...
  includeContent: boolean;
}
```

### Message Formatting

**Slack (Block Kit):**

```typescript
function formatSlackMessage(event: string, data: ResponsePayload): SlackMessage {
  const modeEmoji = { feedback: '💬', vote: data.vote === 'up' ? '👍' : '👎', poll: '📊' };
  const emoji = modeEmoji[data.mode] || '📝';

  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *New ${data.mode} response* on \`${data.elementId}\``,
        },
      },
      // Rating stars if present
      ...(data.rating ? [{
        type: 'section',
        text: { type: 'mrkdwn', text: `${'★'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)} (${data.rating}/5)` },
      }] : []),
      // Content if present and includeContent=true
      ...(data.content ? [{
        type: 'section',
        text: { type: 'mrkdwn', text: `> ${data.content}` },
      }] : []),
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `<${dashboardUrl}|View in Dashboard>` },
        ],
      },
    ],
  };
}
```

**Discord (Embed):**

```typescript
function formatDiscordMessage(event: string, data: ResponsePayload): DiscordMessage {
  const colors = { feedback: 0x3B82F6, vote: data.vote === 'up' ? 0x10B981 : 0xEF4444, poll: 0x8B5CF6 };

  return {
    embeds: [{
      title: `New ${data.mode} response`,
      description: data.content || (data.rating ? `${'★'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)}` : ''),
      color: colors[data.mode] || 0x6B7280,
      fields: [
        { name: 'Element', value: `\`${data.elementId}\``, inline: true },
        ...(data.rating ? [{ name: 'Rating', value: `${data.rating}/5`, inline: true }] : []),
        ...(data.vote ? [{ name: 'Vote', value: data.vote === 'up' ? '👍 Positive' : '👎 Negative', inline: true }] : []),
      ],
      timestamp: new Date().toISOString(),
    }],
  };
}
```

### Integration Point

In the same `fireWebhooks` function from Feature 1, also check for integrations:

```typescript
async function fireNotifications(projectId: string, event: string, data: object) {
  // 1. Fire generic webhooks
  await fireWebhooks(projectId, event, data);

  // 2. Fire Slack/Discord integrations
  const integrations = await prisma.integration.findMany({
    where: { projectId, active: true, events: { has: event } },
  });

  for (const integration of integrations) {
    if (integration.type === 'SLACK') {
      await deliverSlack(integration.config, event, data);
    } else if (integration.type === 'DISCORD') {
      await deliverDiscord(integration.config, event, data);
    }
  }
}
```

### Dashboard UI

Add an **Integrations** tab to project settings:

- **Slack card:** Paste webhook URL, toggle on/off, "Send Test" button
- **Discord card:** Paste webhook URL, toggle on/off, "Send Test" button
- Both show a preview of what the message looks like
- Simple setup guide: "1. Create an Incoming Webhook in Slack → 2. Paste the URL here → 3. Done"

### Files to Create/Edit

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add Integration model |
| `lib/integrations/slack.ts` | Slack message formatting + delivery |
| `lib/integrations/discord.ts` | Discord message formatting + delivery |
| `lib/integrations/index.ts` | Unified `fireNotifications()` |
| `app/api/projects/[slug]/integrations/route.ts` | CRUD endpoints |
| `app/api/projects/[slug]/integrations/[id]/test/route.ts` | Test endpoint |
| `app/(dashboard)/dashboard/projects/[slug]/integrations/page.tsx` | UI |
| `app/api/v1/responses/route.ts` | Wire in `fireNotifications()` |

---

## 3. Response Tagging/Status

**Goal:** Let teams mark responses as "New", "Reviewed", or "Addressed" so feedback doesn't just pile up in a read-only list. Close the feedback loop.

**Effort:** ~3-4 days | **Impact:** HIGH | **Plan:** All plans (basic), PRO (custom tags)

### Database Changes

```prisma
// Add to Response model
model Response {
  // ... existing fields ...
  status      ResponseStatus @default(NEW)
  tags        String[]       @default([])
  reviewedAt  DateTime?
  reviewedBy  String?        // userId who reviewed
}

enum ResponseStatus {
  NEW
  REVIEWED
  ADDRESSED
  ARCHIVED
}
```

### Migration Strategy

Since all existing responses have no status, the default `NEW` handles this cleanly. Run migration:

```sql
ALTER TABLE "Response" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'NEW';
ALTER TABLE "Response" ADD COLUMN "tags" TEXT[] DEFAULT '{}';
ALTER TABLE "Response" ADD COLUMN "reviewedAt" TIMESTAMP;
ALTER TABLE "Response" ADD COLUMN "reviewedBy" TEXT;
```

### API Endpoints

**PATCH `/api/responses/[id]/status`** (Session auth):

```typescript
// Request body
{ status: 'REVIEWED' | 'ADDRESSED' | 'ARCHIVED' }

// Sets reviewedAt = now(), reviewedBy = current user
```

**PATCH `/api/responses/[id]/tags`** (Session auth, PRO only):

```typescript
// Request body
{ tags: ['bug', 'urgent', 'pricing'] }
```

**GET `/api/responses`** — Add filters:

```typescript
// New query params
?status=NEW,REVIEWED    // Comma-separated status filter
&tags=bug,urgent        // Comma-separated tag filter
```

### Dashboard UI Changes

**Responses table (`dashboard/responses/page.tsx`):**

1. **Status badge** on each row — colored pill:
   - NEW: blue dot
   - REVIEWED: yellow dot
   - ADDRESSED: green dot
   - ARCHIVED: gray dot

2. **Quick status toggle** — Click the badge to cycle through statuses, or dropdown to pick one.

3. **Tag chips** — Small tags below the response content. Click "+" to add tags (PRO feature).

4. **Filter bar additions:**
   - Status multi-select filter (NEW, REVIEWED, ADDRESSED, ARCHIVED)
   - Tag filter dropdown (PRO)

5. **Bulk actions** (PRO) — Select multiple responses → "Mark as Reviewed", "Mark as Addressed", "Archive"

**Response detail (on click/expand):**
- Full response content
- Status dropdown
- Tag editor (type-to-add, click-to-remove)
- Timestamp: "Reviewed by [name] on [date]"

### Files to Create/Edit

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add status, tags, reviewedAt, reviewedBy to Response |
| `app/api/responses/[id]/status/route.ts` | New — status update endpoint |
| `app/api/responses/[id]/tags/route.ts` | New — tag update endpoint |
| `app/(dashboard)/dashboard/responses/page.tsx` | Add status badges, tag chips, filters |
| `app/(dashboard)/dashboard/responses/responses-filter.tsx` | Add status + tag filters |
| Components: `StatusBadge.tsx`, `TagEditor.tsx` | New UI components |

---

## 4. NPS Mode

**Goal:** Add a 0-10 Net Promoter Score mode to the SDK. Industry-standard metric that unlocks product manager buyers.

**Effort:** ~4-5 days (SDK + API + Dashboard) | **Impact:** HIGH | **Plan:** All plans

### SDK Changes

#### New Type

In `packages/sdk/src/types.ts`:

```typescript
// Update ResponseMode
export type ResponseMode = 'feedback' | 'vote' | 'poll' | 'nps';

// Add NPS-specific props to GotchaProps
export interface GotchaProps {
  // ... existing props ...

  // NPS mode options
  npsQuestion?: string;           // Default: "How likely are you to recommend us?"
  npsFollowUp?: boolean;          // Show text area after score (default: true)
  npsFollowUpPlaceholder?: string; // Default: "What's the main reason for your score?"
}
```

#### New Mode Component

**File:** `packages/sdk/src/components/modes/NpsMode.tsx`

```typescript
// NPS Mode Component
// - Row of 11 buttons (0-10), highlighted on selection
// - Color gradient: 0-6 red (detractor), 7-8 yellow (passive), 9-10 green (promoter)
// - Optional follow-up textarea after selection
// - Submit button

interface NpsModeProps {
  theme: 'light' | 'dark';
  isLoading: boolean;
  npsQuestion: string;
  npsFollowUp: boolean;
  npsFollowUpPlaceholder: string;
  existingResponse?: { rating?: number; content?: string };
  onSubmit: (data: { rating: number; content?: string }) => void;
}
```

**UI Layout:**
```
┌──────────────────────────────────┐
│ How likely are you to recommend  │
│ us to a friend?                  │
│                                  │
│ Not likely          Very likely  │
│ [0][1][2][3][4][5][6][7][8][9][10]│
│  ─── red ───  ─yellow─  ─green─ │
│                                  │
│ What's the main reason for your  │
│ score?                           │
│ ┌──────────────────────────────┐ │
│ │                              │ │
│ └──────────────────────────────┘ │
│                       [Submit]   │
└──────────────────────────────────┘
```

**Score colors:**
- 0-6 (Detractor): `#EF4444` (red)
- 7-8 (Passive): `#F59E0B` (amber)
- 9-10 (Promoter): `#10B981` (green)

#### Wire Into GotchaModal

In `GotchaModal.tsx`, add the NPS mode render case:

```typescript
{mode === 'nps' && (
  <NpsMode
    theme={resolvedTheme}
    isLoading={isLoading}
    npsQuestion={npsQuestion || "How likely are you to recommend us?"}
    npsFollowUp={npsFollowUp !== false}
    npsFollowUpPlaceholder={npsFollowUpPlaceholder || "What's the main reason for your score?"}
    existingResponse={existingResponse}
    onSubmit={(data) => handleSubmit({ rating: data.rating, content: data.content })}
  />
)}
```

### API Changes

The existing `rating` field (Int?) on the Response model currently stores 1-5. For NPS, it stores 0-10. No schema change needed — just widen the validation.

In `apps/web/app/api/v1/responses/route.ts`, update the Zod schema:

```typescript
// Change rating validation from:
rating: z.number().int().min(1).max(5).optional()
// To:
rating: z.number().int().min(0).max(10).optional()
```

Add `NPS` to the `ResponseMode` enum in Prisma:

```prisma
enum ResponseMode {
  FEEDBACK
  VOTE
  POLL
  FEATURE_REQUEST
  AB
  NPS    // New
}
```

### Dashboard Changes

#### NPS Score Calculation

**File:** `apps/web/lib/nps.ts`

```typescript
export function calculateNPS(ratings: number[]): {
  score: number;         // -100 to 100
  promoters: number;     // count of 9-10
  passives: number;      // count of 7-8
  detractors: number;    // count of 0-6
  total: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
} {
  const promoters = ratings.filter(r => r >= 9).length;
  const passives = ratings.filter(r => r >= 7 && r <= 8).length;
  const detractors = ratings.filter(r => r <= 6).length;
  const total = ratings.length;

  return {
    score: Math.round(((promoters - detractors) / total) * 100),
    promoters, passives, detractors, total,
    promoterPct: Math.round((promoters / total) * 100),
    passivePct: Math.round((passives / total) * 100),
    detractorPct: Math.round((detractors / total) * 100),
  };
}
```

#### Analytics Page Additions

In the analytics charts, add an NPS section (visible when NPS responses exist):

- **NPS Score gauge**: Large number (-100 to 100) with color (red/yellow/green)
- **Distribution bar**: Horizontal stacked bar — red (detractors) | yellow (passives) | green (promoters)
- **NPS trend line**: Score over time (weekly or monthly)
- **Follow-up text**: List of text responses grouped by promoter/passive/detractor

### Files to Create/Edit

| File | Action |
|------|--------|
| `packages/sdk/src/types.ts` | Add 'nps' to ResponseMode, add NPS props |
| `packages/sdk/src/components/modes/NpsMode.tsx` | **New** — NPS mode component |
| `packages/sdk/src/components/GotchaModal.tsx` | Wire in NpsMode |
| `packages/sdk/src/index.ts` | Export new types if needed |
| `prisma/schema.prisma` | Add NPS to ResponseMode enum |
| `apps/web/app/api/v1/responses/route.ts` | Widen rating validation to 0-10 |
| `apps/web/lib/nps.ts` | **New** — NPS calculation logic |
| `apps/web/app/(dashboard)/dashboard/analytics/charts.tsx` | Add NPS visualizations |

---

## 5. AI Feedback Summaries

**Goal:** Use an LLM to summarize feedback themes, surface top issues, and generate actionable insights. Uniquely powerful because Gotcha has element-level context no competitor has.

**Effort:** ~1-2 weeks | **Impact:** HIGH | **Plan:** PRO only

### Architecture

```
User clicks "Generate Summary" on analytics page
  ↓
POST /api/analytics/summary
  ↓
Fetch last N responses (with element context)
  ↓
Build prompt with structured data
  ↓
Call Claude API (Haiku for speed + cost)
  ↓
Return structured summary
  ↓
Cache result (1 hour TTL)
```

### API Endpoint

**POST `/api/analytics/summary`** (Session auth, PRO only):

```typescript
// Request
{
  projectId?: string,      // Filter by project (optional)
  elementId?: string,      // Filter by element (optional)
  startDate?: string,      // Default: last 30 days
  endDate?: string,
}

// Response
{
  summary: string,                    // 2-3 sentence overview
  themes: Array<{
    name: string,                     // e.g. "Confusing pricing page"
    count: number,                    // How many responses mention this
    sentiment: 'positive' | 'negative' | 'neutral',
    sampleQuotes: string[],          // 2-3 verbatim quotes
  }>,
  elementInsights: Array<{
    elementId: string,
    avgRating: number,
    insight: string,                  // e.g. "Users find the checkout flow frustrating"
  }>,
  actionItems: string[],             // 3-5 suggested next steps
  generatedAt: string,
  responseCount: number,             // How many responses were analyzed
}
```

### Implementation

**File:** `apps/web/lib/ai-summary.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic(); // Uses ANTHROPIC_API_KEY env var

export async function generateFeedbackSummary(params: SummaryParams) {
  // 1. Fetch responses
  const responses = await prisma.response.findMany({
    where: {
      project: { organizationId: params.orgId },
      ...(params.projectId && { projectId: params.projectId }),
      ...(params.elementId && { elementIdRaw: params.elementId }),
      createdAt: { gte: params.startDate, lte: params.endDate },
      content: { not: null },  // Only responses with text
    },
    select: {
      content: true,
      rating: true,
      vote: true,
      mode: true,
      elementIdRaw: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 500,  // Cap at 500 for cost/speed
  });

  if (responses.length < 5) {
    return { error: 'Not enough text responses to generate a summary (minimum 5).' };
  }

  // 2. Build prompt
  const prompt = buildSummaryPrompt(responses);

  // 3. Call Claude
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  // 4. Parse structured response
  return parseSummaryResponse(message.content[0].text);
}

function buildSummaryPrompt(responses: ResponseData[]): string {
  // Group by element for context
  const byElement = groupBy(responses, 'elementIdRaw');

  const dataBlock = Object.entries(byElement).map(([elementId, resps]) => {
    const lines = resps.map(r => {
      let line = '';
      if (r.rating) line += `[${r.rating}/5 stars] `;
      if (r.vote) line += `[${r.vote === 'UP' ? '👍' : '👎'}] `;
      line += r.content || '(no text)';
      return line;
    });
    return `## Element: ${elementId}\n${lines.join('\n')}`;
  }).join('\n\n');

  return `You are analyzing user feedback for a software product. The feedback is organized by UI element/component.

${dataBlock}

Analyze this feedback and return a JSON object with:
1. "summary": A 2-3 sentence overview of the overall feedback sentiment and key patterns.
2. "themes": Array of 3-7 recurring themes, each with "name", "count" (approximate), "sentiment" (positive/negative/neutral), and "sampleQuotes" (2-3 verbatim quotes).
3. "elementInsights": For each element with 3+ responses, provide "elementId", "avgRating" (if available), and a one-sentence "insight".
4. "actionItems": 3-5 specific, actionable suggestions based on the feedback.

Return ONLY valid JSON, no markdown.`;
}
```

### Caching

Use Upstash Redis (already in the project for rate limiting):

```typescript
const cacheKey = `summary:${orgId}:${projectId}:${elementId}:${startDate}:${endDate}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await generateFeedbackSummary(params);
await redis.set(cacheKey, JSON.stringify(result), { ex: 3600 }); // 1 hour TTL
```

### Dashboard UI

Add an **"AI Summary"** section to the analytics page:

- **"Generate Summary" button** — triggers the API call
- **Loading state** — "Analyzing [N] responses..." with spinner (takes 3-5 seconds)
- **Summary card:**
  - Overview paragraph at the top
  - Theme cards in a grid (name, count, sentiment badge, sample quotes collapsed by default)
  - Element insights table
  - Action items as a checklist
- **"Regenerate" button** — clears cache and generates fresh
- **Timestamp** — "Generated 45 minutes ago from 234 responses"

### Cost Control

- Claude Haiku: ~$0.001 per summary (500 responses ≈ 3K input tokens)
- Cached for 1 hour — most users won't regenerate more than 2-3 times per day
- Cap at 500 responses per summary to keep costs predictable
- Estimated monthly cost at 1000 active PRO users: ~$30-60/month

### Files to Create/Edit

| File | Action |
|------|--------|
| `apps/web/lib/ai-summary.ts` | **New** — Core summary generation |
| `apps/web/app/api/analytics/summary/route.ts` | **New** — API endpoint |
| `apps/web/app/(dashboard)/dashboard/analytics/ai-summary.tsx` | **New** — UI component |
| `apps/web/app/(dashboard)/dashboard/analytics/page.tsx` | Wire in AI summary section |
| `.env` | Add `ANTHROPIC_API_KEY` |
| `package.json` | Add `@anthropic-ai/sdk` dependency |

---

## 6. Embeddable Score Component

**Goal:** A new SDK component `<GotchaScore />` that renders aggregate feedback inline — e.g., "4.2/5 from 847 users". Turns feedback collection into social proof. No competitor does this.

**Effort:** ~4-5 days (SDK + API) | **Impact:** MEDIUM | **Plan:** All plans (basic), PRO (customization)

### New API Endpoint

**GET `/api/v1/scores/[elementId]`** (API Key auth):

```typescript
// Response
{
  elementId: string,
  averageRating: number | null,       // 1-5 scale average
  totalResponses: number,
  ratingCount: number,
  voteCount: { up: number, down: number },
  positiveRate: number | null,        // % positive votes
  npsScore: number | null,            // -100 to 100
}
```

**Implementation:**
```typescript
// Simple aggregation query
const stats = await prisma.response.aggregate({
  where: { projectId, elementIdRaw: elementId, gated: false },
  _count: true,
  _avg: { rating: true },
});

const votes = await prisma.response.groupBy({
  by: ['vote'],
  where: { projectId, elementIdRaw: elementId, vote: { not: null }, gated: false },
  _count: true,
});
```

**Caching:** Cache for 5 minutes in Redis to avoid hammering the DB on high-traffic pages.

### SDK Component

**File:** `packages/sdk/src/components/GotchaScore.tsx`

```typescript
export interface GotchaScoreProps {
  elementId: string;

  // Display options
  variant?: 'stars' | 'number' | 'compact' | 'votes';  // default: 'stars'
  showCount?: boolean;    // Show "(847 responses)" — default: true
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark' | 'auto';

  // Refresh
  refreshInterval?: number;  // ms, default: 0 (no auto-refresh)

  // Styling
  className?: string;
  style?: React.CSSProperties;
}
```

**Variants:**

```
stars:    ★★★★☆ 4.2 (847 responses)
number:  4.2/5 (847 responses)
compact: 4.2 ★ (847)
votes:   👍 89% positive (234 votes)
```

**Implementation:**

```typescript
export function GotchaScore({ elementId, variant = 'stars', showCount = true, ... }: GotchaScoreProps) {
  const { client } = useGotcha();
  const [score, setScore] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.getScore(elementId).then(setScore).finally(() => setLoading(false));

    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        client.getScore(elementId).then(setScore);
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [elementId, refreshInterval]);

  if (loading) return <ScoreSkeleton size={size} />;
  if (!score || score.totalResponses === 0) return null; // Hide if no data

  return (
    <span className={className} style={style} data-gotcha-score>
      {variant === 'stars' && <StarDisplay rating={score.averageRating} />}
      {variant === 'number' && <NumberDisplay rating={score.averageRating} />}
      {variant === 'compact' && <CompactDisplay rating={score.averageRating} />}
      {variant === 'votes' && <VoteDisplay positiveRate={score.positiveRate} count={score.voteCount} />}
      {showCount && <span>({score.totalResponses} {score.totalResponses === 1 ? 'response' : 'responses'})</span>}
    </span>
  );
}
```

### API Client Addition

In `packages/sdk/src/api/client.ts`:

```typescript
async getScore(elementId: string): Promise<ScoreData> {
  const res = await fetch(`${this.baseUrl}/scores/${encodeURIComponent(elementId)}`, {
    headers: { Authorization: `Bearer ${this.apiKey}` },
  });
  if (!res.ok) throw new GotchaError(await res.json());
  return res.json();
}
```

### Usage Example

```tsx
import { GotchaProvider, Gotcha, GotchaScore } from 'gotcha-feedback';

function PricingPage() {
  return (
    <GotchaProvider apiKey="gtch_live_...">
      {/* Show aggregate score */}
      <GotchaScore elementId="pricing-table" variant="stars" />

      {/* Collect feedback */}
      <Gotcha elementId="pricing-table" mode="feedback">
        <PricingTable />
      </Gotcha>
    </GotchaProvider>
  );
}
```

### Files to Create/Edit

| File | Action |
|------|--------|
| `apps/web/app/api/v1/scores/[elementId]/route.ts` | **New** — Score aggregation endpoint |
| `packages/sdk/src/components/GotchaScore.tsx` | **New** — Score display component |
| `packages/sdk/src/api/client.ts` | Add `getScore()` method |
| `packages/sdk/src/types.ts` | Add `GotchaScoreProps`, `ScoreData` |
| `packages/sdk/src/index.ts` | Export `GotchaScore` |

---

## 7. Element-Level Analytics Dashboard

**Goal:** Exploit Gotcha's unique advantage — per-component data — to answer "which parts of your app are weakest?" with benchmarking, anomaly detection, segment comparison, and trend lines.

**Effort:** ~2-3 weeks | **Impact:** HIGH | **Plan:** PRO only

### 7a. Element Benchmarking

**What it shows:** A ranked table/chart of all instrumented elements, compared against each other.

**API Endpoint:** **GET `/api/analytics/elements`** (Session auth, PRO only)

```typescript
// Response
{
  elements: Array<{
    elementId: string,
    elementName: string | null,
    totalResponses: number,
    avgRating: number | null,
    positiveRate: number | null,     // % positive votes
    npsScore: number | null,
    responseRate: number,            // responses per day (last 30d)
    trend: 'improving' | 'declining' | 'stable',
    lastResponseAt: string,
  }>,
  overallAvgRating: number,          // Cross-element average for comparison
  overallPositiveRate: number,
}
```

**Dashboard UI:**

```
Element Performance Benchmarks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Element            Rating  vs Avg  Positive  Trend
──────────────────────────────────────────────────
pricing-table      2.1/5   ▼ -1.9   34%      📉
checkout-flow      2.8/5   ▼ -1.2   45%      📉
dashboard-main     4.5/5   ▲ +0.5   92%      📈
onboarding-step1   4.1/5   ▲ +0.1   88%      →
settings-page      3.8/5   ▼ -0.2   71%      →
──────────────────────────────────────────────────
Overall average:   4.0/5            78%
```

- Sort by: worst rating, most responses, biggest decline
- Color coding: red if below average, green if above
- Click any row to drill into that element's details

### 7b. Anomaly Detection

**What it shows:** Alerts when feedback patterns change significantly.

**Logic:** Compare the last 7 days to the prior 30-day baseline for each element:

```typescript
interface Anomaly {
  elementId: string;
  type: 'volume_spike' | 'volume_drop' | 'rating_drop' | 'rating_spike' | 'sentiment_shift';
  description: string;    // e.g. "Feedback volume on pricing-table spiked 300% this week"
  severity: 'info' | 'warning' | 'critical';
  currentValue: number;
  baselineValue: number;
  changePercent: number;
}
```

**Detection rules:**
- Volume spike: >200% of baseline daily average → warning, >500% → critical
- Volume drop: <30% of baseline when baseline is >10 responses → info
- Rating drop: >0.5 star decrease from baseline → warning, >1.0 → critical
- Sentiment shift: Positive rate drops >15 percentage points → warning

**Dashboard UI:**

Show anomalies as alert cards at the top of the analytics page:

```
⚠️  pricing-table: Rating dropped from 3.8 to 2.1 this week (-1.7)
🔴  checkout-flow: Feedback volume spiked 340% (12/day → 41/day)
ℹ️  settings-page: No feedback received in the last 7 days
```

### 7c. Segment Comparison

**What it shows:** Side-by-side comparison of how different user segments rate the same elements.

**Enhanced API:** **GET `/api/analytics/segment-compare`** (Session auth, PRO only)

```typescript
// Request
{
  projectId?: string,
  elementId: string,          // Compare segments for this element
  groupBy: string,            // Metadata field (e.g. "plan", "device")
}

// Response
{
  elementId: string,
  segments: Array<{
    segmentValue: string,     // e.g. "free", "pro"
    responseCount: number,
    avgRating: number | null,
    positiveRate: number | null,
    topThemes: string[],      // Most common words (simple frequency)
  }>,
}
```

**Dashboard UI:**

```
Segment Comparison: pricing-table
Grouped by: plan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Segment     Responses  Rating  Positive
─────────────────────────────────────────
Free users    142       2.1     28%    🔴
Pro users      87       4.2     89%    🟢
─────────────────────────────────────────
```

- Bar chart comparing ratings side by side per segment
- Dropdown to switch between elements
- Dropdown to switch groupBy field

### 7d. Trend Lines

**What it shows:** Rating/sentiment over time for each element. Answers "is our product getting better or worse?"

**API Endpoint:** **GET `/api/analytics/element-trends`** (Session auth, PRO only)

```typescript
// Request
{
  projectId?: string,
  elementId?: string,     // Specific element or all
  period: 'daily' | 'weekly' | 'monthly',
  startDate: string,
  endDate: string,
}

// Response
{
  trends: Array<{
    elementId: string,
    dataPoints: Array<{
      date: string,
      avgRating: number | null,
      responseCount: number,
      positiveRate: number | null,
      npsScore: number | null,
    }>,
  }>,
}
```

**Implementation:** Group responses by element + time bucket, aggregate:

```sql
SELECT
  "elementIdRaw",
  DATE_TRUNC('week', "createdAt") as period,
  AVG("rating") as avg_rating,
  COUNT(*) as response_count,
  COUNT(CASE WHEN "vote" = 'UP' THEN 1 END)::float /
    NULLIF(COUNT(CASE WHEN "vote" IS NOT NULL THEN 1 END), 0) as positive_rate
FROM "Response"
WHERE "projectId" = $1
  AND "createdAt" BETWEEN $2 AND $3
GROUP BY "elementIdRaw", DATE_TRUNC('week', "createdAt")
ORDER BY period ASC
```

**Dashboard UI:**

- **Multi-line chart** (Recharts LineChart) — one line per element
- Toggle elements on/off
- Switch between: avg rating, response volume, positive rate, NPS score
- Time period selector: daily / weekly / monthly
- Highlight trend direction with up/down arrows

### New Analytics Page Layout

Reorganize the analytics page into tabs:

```
[Overview] [Elements] [Trends] [Segments] [AI Summary]
```

**Overview tab** (existing):
- Summary stat cards
- Response trend line
- Mode distribution
- Vote sentiment

**Elements tab** (new — 7a + 7b):
- Anomaly alerts at top
- Element benchmarking table
- Click-to-drill-down into any element

**Trends tab** (new — 7d):
- Multi-element trend chart
- Period selector
- Metric selector

**Segments tab** (existing, enhanced — 7c):
- Existing segment charts
- New: per-element segment comparison

**AI Summary tab** (from Feature 5):
- Generate/view AI summaries

### Files to Create/Edit

| File | Action |
|------|--------|
| `apps/web/app/api/analytics/elements/route.ts` | **New** — Element benchmarking |
| `apps/web/app/api/analytics/anomalies/route.ts` | **New** — Anomaly detection |
| `apps/web/app/api/analytics/segment-compare/route.ts` | **New** — Segment comparison |
| `apps/web/app/api/analytics/element-trends/route.ts` | **New** — Trend data |
| `apps/web/app/(dashboard)/dashboard/analytics/page.tsx` | Reorganize into tabs |
| `apps/web/app/(dashboard)/dashboard/analytics/elements-tab.tsx` | **New** |
| `apps/web/app/(dashboard)/dashboard/analytics/trends-tab.tsx` | **New** |
| `apps/web/app/(dashboard)/dashboard/analytics/anomaly-alerts.tsx` | **New** |
| `apps/web/app/(dashboard)/dashboard/analytics/element-compare.tsx` | **New** |

---

## 8. Bug Flagging & Ticket Tracking

**Goal:** Let users flag feedback as a bug report, automatically generating a rich ticket with all contextual data (element, URL, device, user segment). Dev teams track bugs through a lightweight pipeline, and users get notified when their bug is fixed. Unique because Gotcha already knows *where* in the app the bug was reported.

**Effort:** ~1.5-2 weeks | **Impact:** HIGH | **Plan:** PRO only (flagging available on all plans, tracking dashboard PRO)

### Why This Is Powerful

When a user reports a bug through Gotcha, the system already knows:
- **Which component** — the exact `elementId`
- **Which page** — the URL captured in context
- **What they said** — the feedback text
- **Their environment** — userAgent (browser, OS, device)
- **Who they are** — user segment metadata (plan, role, etc.)
- **When it happened** — timestamp

That's 80% of a good bug report, generated automatically. No other feedback tool can produce this because none of them have component-level context.

### Database Changes

Add to `prisma/schema.prisma`:

```prisma
model BugTicket {
  id              String          @id @default(cuid())
  projectId       String
  project         Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  responseId      String          @unique
  response        Response        @relation(fields: [responseId], references: [id], onDelete: Cascade)

  // Auto-populated from response context
  title           String          // Auto-generated or user-provided
  description     String          // Feedback content + auto-context
  elementId       String          // Which component
  pageUrl         String?         // Where it happened
  userAgent       String?         // Browser/OS/device
  endUserMeta     Json?           // User segment data

  // Ticket management
  status          BugStatus       @default(OPEN)
  priority        BugPriority     @default(MEDIUM)
  assigneeId      String?         // Organization member assigned
  assignee        User?           @relation(fields: [assigneeId], references: [id])

  // AI triage (optional, generated on creation)
  aiSummary       String?         // AI-generated structured bug report
  aiSeverity      String?         // AI-estimated severity
  aiComponent     String?         // AI-suggested component/area

  // Resolution
  resolvedAt      DateTime?
  resolvedBy      String?
  resolutionNote  String?         // "Fixed in v2.3.1" or freeform

  // User notification
  notifyUser      Boolean         @default(true)   // Notify reporter when resolved
  endUserId       String?         // From the original response

  // Timestamps
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([projectId, status])
  @@index([projectId, createdAt])
}

enum BugStatus {
  OPEN
  INVESTIGATING
  FIXING
  RESOLVED
  CLOSED
  WONT_FIX
}

enum BugPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

Also add to the Response model:

```prisma
model Response {
  // ... existing fields ...
  isBug       Boolean     @default(false)
  bugTicket   BugTicket?
}
```

### SDK Changes — Bug Flag Button

Add a "Report Bug" option to the feedback flow. Two approaches (keep it simple):

**Option A — Post-submission flag (recommended):**

After a user submits feedback (any mode), show a small link: "Is this a bug? Flag it."

In `GotchaModal.tsx`, in the success state (after submission):

```typescript
// After "Thank you!" message, show:
{enableBugFlag && (
  <button onClick={() => flagAsBug(responseId)} style={bugFlagStyle}>
    Report this as a bug
  </button>
)}
```

**New prop on Gotcha component:**

```typescript
interface GotchaProps {
  // ... existing props ...
  enableBugFlag?: boolean;  // Show "flag as bug" after submission. Default: false
}
```

**API call from SDK:**

```typescript
// In client.ts
async flagAsBug(responseId: string): Promise<{ ticketId: string }> {
  const res = await fetch(`${this.baseUrl}/responses/${responseId}/bug`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new GotchaError(await res.json());
  return res.json();
}
```

**Option B — Dedicated bug mode:**

Add `mode="bug"` which shows a textarea with "Describe the bug" placeholder, plus optional screenshot upload. This is more work and less aligned with Gotcha's lightweight identity — Option A is better for V1.

### API Endpoints

#### Flag a response as a bug

**POST `/api/v1/responses/[id]/bug`** (API Key auth):

```typescript
// Creates a BugTicket from an existing response

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { apiKey } = await validateApiKey(req);
  const response = await prisma.response.findUnique({
    where: { id: params.id, projectId: apiKey.projectId },
  });

  if (!response) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (response.isBug) return NextResponse.json({ error: 'Already flagged' }, { status: 409 });

  // Auto-generate title from content
  const title = response.content
    ? response.content.slice(0, 100) + (response.content.length > 100 ? '...' : '')
    : `Bug report on ${response.elementIdRaw}`;

  // Build rich description
  const description = [
    response.content || '(No description provided)',
    '',
    '---',
    `**Element:** \`${response.elementIdRaw}\``,
    response.url ? `**Page:** ${response.url}` : null,
    response.userAgent ? `**Browser:** ${parseUserAgent(response.userAgent)}` : null,
    response.rating ? `**Rating:** ${response.rating}/5` : null,
    response.vote ? `**Vote:** ${response.vote === 'UP' ? 'Positive' : 'Negative'}` : null,
    `**Reported:** ${response.createdAt.toISOString()}`,
  ].filter(Boolean).join('\n');

  // Create ticket + mark response
  const [ticket] = await prisma.$transaction([
    prisma.bugTicket.create({
      data: {
        projectId: apiKey.projectId,
        responseId: response.id,
        title,
        description,
        elementId: response.elementIdRaw,
        pageUrl: response.url,
        userAgent: response.userAgent,
        endUserMeta: response.endUserMeta,
        endUserId: response.endUserId,
      },
    }),
    prisma.response.update({
      where: { id: response.id },
      data: { isBug: true },
    }),
  ]);

  // Fire webhook (non-blocking)
  fireNotifications(apiKey.projectId, 'bug.created', {
    ticketId: ticket.id,
    title: ticket.title,
    elementId: ticket.elementId,
    pageUrl: ticket.pageUrl,
    priority: ticket.priority,
  });

  // Optional: AI triage (non-blocking)
  triageBugWithAI(ticket.id).catch(console.error);

  return NextResponse.json({ ticketId: ticket.id, status: 'created' });
}
```

#### Bug ticket management (Dashboard)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/bugs` | Session | List bug tickets (with filters) |
| GET | `/api/bugs/[id]` | Session | Get ticket detail |
| PATCH | `/api/bugs/[id]` | Session | Update status, priority, assignee, notes |
| POST | `/api/bugs/[id]/resolve` | Session | Resolve + optionally notify user |
| GET | `/api/bugs/stats` | Session | Bug counts by status, priority |

#### List bugs endpoint

**GET `/api/bugs`** (Session auth):

```typescript
// Query params
?projectId=...
&status=OPEN,INVESTIGATING       // Comma-separated filter
&priority=HIGH,CRITICAL          // Comma-separated filter
&elementId=...                   // Filter by component
&assigneeId=...                  // Filter by assignee
&sort=newest|oldest|priority     // Sort order
&page=1&limit=20

// Response
{
  data: BugTicket[],
  pagination: { page, limit, total, hasMore },
  stats: {
    open: number,
    investigating: number,
    fixing: number,
    resolved: number,
  }
}
```

#### Resolve + notify

**POST `/api/bugs/[id]/resolve`** (Session auth):

```typescript
// Request
{
  resolutionNote?: string,    // "Fixed in v2.3.1"
  notifyUser?: boolean,       // Default: true (if endUserId exists)
}

// This:
// 1. Updates ticket status to RESOLVED
// 2. Sets resolvedAt, resolvedBy
// 3. If notifyUser && endUserId exists:
//    - Fires webhook: 'bug.resolved'
//    - The developer can use this webhook to notify the user however they want
//    (email, in-app notification, etc.)
```

### AI Bug Triage

When a bug is created, optionally run Claude Haiku to generate a structured triage:

**File:** `apps/web/lib/ai-triage.ts`

```typescript
export async function triageBugWithAI(ticketId: string) {
  const ticket = await prisma.bugTicket.findUnique({
    where: { id: ticketId },
    include: { response: true },
  });

  // Fetch recent similar bugs on same element for context
  const similarBugs = await prisma.bugTicket.findMany({
    where: {
      projectId: ticket.projectId,
      elementId: ticket.elementId,
      id: { not: ticket.id },
    },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  const prompt = `You are triaging a bug report for a software product.

Bug report:
- Element/Component: ${ticket.elementId}
- Page URL: ${ticket.pageUrl || 'Unknown'}
- User's description: ${ticket.description}
- Browser: ${ticket.userAgent || 'Unknown'}
- User segment: ${JSON.stringify(ticket.endUserMeta || {})}

${similarBugs.length > 0 ? `Recent bugs on the same component:\n${similarBugs.map(b => `- ${b.title} (${b.status})`).join('\n')}` : ''}

Provide a JSON response with:
1. "summary": A clear 1-2 sentence description of the bug suitable for a developer.
2. "severity": One of "low", "medium", "high", "critical" based on likely user impact.
3. "suggestedComponent": Your best guess at which part of the codebase is affected.
4. "reproductionHints": 1-3 bullet points on likely reproduction steps.
5. "similarPattern": If the similar bugs suggest a recurring issue, note it. Otherwise null.

Return ONLY valid JSON.`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const triage = JSON.parse(message.content[0].text);

  await prisma.bugTicket.update({
    where: { id: ticketId },
    data: {
      aiSummary: triage.summary,
      aiSeverity: triage.severity,
      aiComponent: triage.suggestedComponent,
      // Optionally auto-set priority based on AI severity
      priority: mapSeverityToPriority(triage.severity),
    },
  });
}
```

### Dashboard UI — Bug Tracker

Add a new **Bugs** page to the dashboard sidebar: `/dashboard/bugs`

#### Bug List View

```
Bugs (12 open)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[OPEN] [INVESTIGATING] [FIXING] [RESOLVED] [ALL]

🔴 CRITICAL  "Checkout fails on mobile Safari"
              checkout-flow · 2 hours ago · Unassigned
              AI: Payment form loses focus on iOS keyboard dismiss

🟡 HIGH      "Pricing calculator shows wrong total"
              pricing-table · 5 hours ago · @karim
              AI: Discount logic may not account for annual toggle

🔵 MEDIUM    "Dark mode text hard to read on settings"
              settings-page · 1 day ago · Unassigned

[+ 9 more bugs]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Filters:** Status tabs, priority dropdown, element filter, assignee filter
**Sort:** Newest, oldest, priority (critical first)
**Bulk actions:** Assign, change priority, close

#### Bug Detail View

```
← Back to bugs

"Checkout fails on mobile Safari"                    🔴 CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: [INVESTIGATING ▾]    Priority: [CRITICAL ▾]    Assignee: [@karim ▾]

── Context (auto-captured) ──────────────────────────────
Element:    checkout-flow
Page:       /checkout
Browser:    Safari 17.2 / iOS 17.3 / iPhone
User:       Pro plan, US region

── User's Report ────────────────────────────────────────
"When I tap the submit button on checkout, the whole form
refreshes and my card info disappears. Happened 3 times."
Rating: ★★☆☆☆ (2/5)

── AI Triage ────────────────────────────────────────────
Summary: Payment form state is likely being lost due to iOS
keyboard dismiss triggering a re-render. The form may not
be preserving controlled input state across focus changes.

Severity: Critical (payment flow directly affected)
Suggested area: Checkout form state management
Reproduction hints:
  • Open checkout on iOS Safari
  • Fill in card details
  • Dismiss keyboard by tapping outside, then tap submit
Similar pattern: 2 previous bugs on checkout-flow in last 30 days

── Resolution ───────────────────────────────────────────
[                                                       ]
[  Add resolution note...                               ]
[                                                       ]

[Resolve & Notify User]   [Resolve Silently]   [Won't Fix]
```

#### Bug Stats (on analytics page)

Add a small "Bug Overview" card to the analytics overview tab:

```
Bugs This Month
━━━━━━━━━━━━━━━━
12 reported
 8 resolved
 4 open (2 critical)

Avg resolution time: 2.3 days
Buggiest element: checkout-flow (5 bugs)
```

### Webhook Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `bug.created` | User flags feedback as bug | Ticket ID, title, element, priority |
| `bug.updated` | Status/priority/assignee changes | Ticket ID, changed fields |
| `bug.resolved` | Bug marked as resolved | Ticket ID, resolution note, user ID |

These integrate with the webhook system from Feature 1, so teams can pipe bug reports to Linear, Jira, GitHub Issues, etc.

### User-Facing Notification Flow

When a bug is resolved with `notifyUser: true`:

1. Webhook fires `bug.resolved` event with `endUserId`
2. The developer's webhook handler sends notification to the user however they want (email, in-app, push)
3. Gotcha doesn't send the notification directly — it provides the signal. The developer decides the channel.

This keeps Gotcha lightweight and avoids needing email infrastructure for end users.

### Files to Create/Edit

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add BugTicket model, BugStatus/BugPriority enums, isBug on Response |
| `apps/web/app/api/v1/responses/[id]/bug/route.ts` | **New** — Flag as bug endpoint |
| `apps/web/app/api/bugs/route.ts` | **New** — List bugs |
| `apps/web/app/api/bugs/[id]/route.ts` | **New** — Get/update bug |
| `apps/web/app/api/bugs/[id]/resolve/route.ts` | **New** — Resolve + notify |
| `apps/web/app/api/bugs/stats/route.ts` | **New** — Bug statistics |
| `apps/web/lib/ai-triage.ts` | **New** — AI bug triage |
| `apps/web/app/(dashboard)/dashboard/bugs/page.tsx` | **New** — Bug list page |
| `apps/web/app/(dashboard)/dashboard/bugs/[id]/page.tsx` | **New** — Bug detail page |
| `apps/web/app/(dashboard)/dashboard/analytics/charts.tsx` | Add bug stats card |
| `packages/sdk/src/components/GotchaModal.tsx` | Add "Report as bug" post-submission link |
| `packages/sdk/src/components/Gotcha.tsx` | Add `enableBugFlag` prop |
| `packages/sdk/src/api/client.ts` | Add `flagAsBug()` method |
| `packages/sdk/src/types.ts` | Add `enableBugFlag` to GotchaProps |

---

## Implementation Order

The features have dependencies. Recommended order:

```
Feature 3: Response Tagging/Status     ← No dependencies, quick win
    ↓
Feature 1: Webhooks/API                ← No dependencies, foundational
    ↓
Feature 2: Slack/Discord               ← Depends on webhook infra from #1
    ↓
Feature 8: Bug Flagging & Tickets      ← Depends on webhooks (#1), benefits from tagging (#3)
    ↓
Feature 4: NPS Mode                    ← Independent (SDK + API + dashboard)
    ↓
Feature 7: Element-Level Analytics     ← Independent, biggest dashboard change
    ↓
Feature 6: Embeddable Score Component  ← Needs score API from #7
    ↓
Feature 5: AI Summaries                ← Best done last (benefits from all other data + bug triage)
```

Each feature is self-contained and shippable independently. Start with Feature 3 (tagging) — it's the quickest win and immediately makes the dashboard more useful.

Feature 8 (Bug Flagging) slots in after webhooks because it fires `bug.created`/`bug.resolved` events, and the AI triage reuses the same Claude integration as Feature 5.
