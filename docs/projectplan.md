# Marketing Pages Update — Reflect New Features

## Context

Gotcha has had significant upgrades: NPS mode, bug tracking, webhooks (Slack/Discord), team workspaces, data export (CSV/JSON with filters), GDPR data APIs, and the upcoming Score component. The marketing pages (landing, pricing, demo) don't reflect these.

## Todo

### 1. Features Section — Update feature cards
- [x] Replace "Ratings, Votes, and Polls" with expanded card covering all 5 modes (feedback, vote, poll, NPS, bug reports)
- [x] Add "Team Workspaces" card (invite team, roles, workspace switcher)
- [x] Add "Webhooks & Integrations" card (Slack, Discord, custom endpoints)
- [x] Add "Export & Analyze" card (CSV/JSON export, filtered segments)
- [x] Removed "5 Minutes to First Feedback" and "Zero Performance Impact" standalone cards — folded into other cards
- [x] Keep total at 6 cards to maintain grid layout

### 2. Pricing Toggle — Update Pro features list
- [x] Add: NPS & satisfaction tracking
- [x] Add: Bug tracking & flagging
- [x] Add: Webhooks (Slack, Discord)
- [x] Add: Team workspaces & roles
- [x] Add: Export to CSV & JSON (was CSV only)
- [x] Add: GDPR data export & deletion API

### 3. Landing Page — Update "Use Gotcha" benefits and code example
- [x] Update "Use Gotcha" list to mention NPS, webhooks, teams, export
- [x] Update code example to show NPS and vote modes

### 4. Demo Page — Add NPS mode demos
- [x] Add NPS mode card to the Modes section
- [x] Add NPS real-world example to Real World Examples

### 5. Hero Section — Update subtitle
- [x] Update hero subtitle to mention NPS and bug tracking alongside ratings/votes

### 6. Pricing FAQ — Update response definition
- [x] Update "What counts as a response?" to include NPS scores and bug reports

## Files

| File | Action |
|------|--------|
| `apps/web/app/(marketing)/features-section.tsx` | Updated 4 of 6 feature cards |
| `apps/web/app/(marketing)/pricing/pricing-toggle.tsx` | Updated Pro features (both monthly + annual) |
| `apps/web/app/(marketing)/page.tsx` | Updated benefits list + code example |
| `apps/web/app/(marketing)/demo/page.tsx` | Added NPS mode demo + NPS real-world example |
| `apps/web/app/(marketing)/hero-section.tsx` | Updated subtitle |
| `apps/web/app/(marketing)/pricing/page.tsx` | Updated FAQ response definition |

6 files modified, 0 new files.

## Review

**Changes made:**
- **Features section**: Replaced 3 cards (5 Minutes, Ratings/Votes/Polls, Zero Performance) with 4 new cards (5 Modes, Team Workspaces, Webhooks & Integrations, Export & Analyze). Kept Feedback Where It Matters and Built for How You Already Work (added ~15KB note to the latter). Total stays at 6 cards.
- **Pricing**: Pro tier now lists 10 features (up from 7), covering NPS, bugs, teams, webhooks, JSON export, and GDPR API. Both monthly and annual tiers updated identically.
- **Landing page**: "Use Gotcha" benefits now highlight NPS, webhooks, teams, and export instead of generic "constantly improving". Code example shows 3 modes (feedback, NPS, vote) instead of just one.
- **Demo page**: Added NPS mode to the modes grid (now 5 cards) and a "NPS Survey" real-world example card.
- **Hero**: Subtitle now reads "rate, vote, submit NPS scores, and flag bugs" instead of just "rate, vote, and respond".
- **Pricing FAQ**: Response definition now includes NPS scores and bug reports.

All changes are content/copy updates within existing components — no structural or styling changes.
