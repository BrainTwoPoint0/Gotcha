# Gotcha Marketing Analysis & Action Plan

*Analysis powered by frameworks from [Corey Haines' Marketing Skills](https://github.com/coreyhaines31/marketingskills)*

---

## 1. Product Marketing Context (PMC)

**One-liner:** Gotcha is a contextual feedback SDK for React — users give feedback right where they experience features.

**Category:** Developer tools / Product feedback / User research

**Value metric:** Responses per month (scales with usage = good)

**Differentiation:** Element-level feedback (no one else does this natively). Competitors are page-level or portal-based.

**Target:** Solo devs, indie hackers, startups (2-50 people), product managers at SaaS companies.

**Current feature set (as of March 2026):**
- 5 feedback modes: star ratings, thumbs up/down, polls, NPS (0-10), bug reports
- Team workspaces with roles (Owner, Admin, Member, Viewer) and workspace switcher
- Webhooks to Slack, Discord, or custom endpoints
- Data export to CSV & JSON with filter forwarding
- GDPR data export & deletion API
- Element-level analytics with benchmarking and anomaly detection
- User segmentation (company size, role, industry, use case, plan)
- Response tagging and status tracking (New / Reviewed / Addressed)
- Annual billing option ($24/mo billed annually)

---

## 2. Landing Page CRO Audit (page-cro framework)

### What's Working
- Clear hero headline: "A direct line between your users and your team"
- npm install code block creates instant developer credibility
- Build vs Buy section is compelling and addresses objections well
- Code example section ("Integrate in 3 lines") reduces perceived effort — now shows multiple modes (feedback, NPS, vote)
- "No credit card required" reduces friction
- Live demo section with interactive Gotcha widgets (Feedback, Vote, Poll)
- Link to full playground with NPS and more modes
- Features section covers all 5 modes, teams, webhooks, export
- "Use Gotcha" benefits list reflects actual features (NPS, webhooks, teams, export)
- Annual billing toggle on pricing page with 17% savings
- "Recommended" badge on Pro tier (not "Most Popular")

### Issues Found

**A. No Social Proof — CRITICAL GAP (STILL OPEN)**
- Zero customer logos, testimonials, or usage numbers anywhere on the homepage
- **Fix:** npm download count badge is now in the hero (good). Add 2-3 short quotes from beta users when available.

**B. No Visual/Demo of the Product — PARTIALLY ADDRESSED**
- Live demo section exists with interactive widgets
- But no screenshot/GIF of the actual dashboard or widget in a real app context
- **Fix:** Add a screenshot of the dashboard analytics view or a GIF showing the widget flow

**C. CTA Copy — DONE**
- Primary CTA is now "Add Feedback in 5 Minutes"

**D. Feature Cards — DONE**
- Rewritten to be benefit-focused: "Ratings, Votes, NPS, Polls & Bugs", "Team Workspaces", "Webhooks & Integrations", "Export & Analyze", etc.

### Remaining Quick Wins
- [ ] Add a product screenshot/GIF to the hero section (dashboard or widget in action)
- [ ] Get 2-3 testimonials or social proof elements from early users

### Completed
- [x] Rewrite hero subtitle to emphasize contextual feedback
- [x] Change CTA text to "Add Feedback in 5 Minutes"
- [x] Add npm download badges to hero
- [x] Add interactive live demo on homepage
- [x] Rewrite feature cards to be benefit-first
- [x] Update code example to show NPS and vote modes
- [x] Add "Plus NPS, bug reports & more" link to full playground
- [x] Update "Use Gotcha" benefits to reflect real features

---

## 3. Pricing Strategy Audit (pricing-strategy framework)

### What's Working
- Two tiers (Free + Pro) is clean and simple
- Pro tier highlighted with "Recommended" badge
- Annual billing toggle with 17% savings ($24/mo vs $29/mo)
- Build vs Buy calculator on pricing page
- "Who uses Gotcha?" section shows real use cases (Education, Startups, Product Teams) instead of empty promises
- Pro features list is comprehensive and accurate (10 features including NPS, bugs, webhooks, teams, export, GDPR API)
- FAQ answers the right questions

### Issues Found

**A. Free Tier Features — UPDATED**
- Now accurately lists: 500 responses/month, 1 project, Response viewer, Email support
- No longer claims analytics features that don't exist on free

**B. Pricing Gap — STILL OPEN**
- Jump from Free ($0) to Pro ($29) is steep for solo devs who just need 2 projects
- **Consider:** Monitor free-to-pro conversion before adding a middle tier
- Competitive analysis suggests a $9-15/mo tier could increase revenue 20-40%

### Completed
- [x] Add annual billing toggle (saves 17%, $24/mo billed annually)
- [x] Change "Most Popular" to "Recommended"
- [x] Replace special programs with use-case framing ("Who uses Gotcha?")
- [x] Update Pro features to include all shipped features
- [x] Fix free tier features to be accurate (removed false analytics claims)

---

## 4. Launch Strategy (launch-strategy / ORB framework)

### Current State Assessment

Gotcha is at **Phase 5** (Full Launch Ready). The product is feature-complete with NPS, bug tracking, webhooks, teams, export, GDPR APIs, and element-level analytics. Published on npm (v1.1.0). Marketing pages updated.

### The ORB Framework Applied to Gotcha

**Owned Channels** (you control):
- Website (gotcha.cx) — updated with all new features
- npm package page — v1.1.0 published
- Blog — missing
- Email list — missing

**Rented Channels** (algorithm-driven):
- Reddit — not started
- Twitter/X — not started
- Dev.to — not started
- Product Hunt — not launched

**Borrowed Channels** (someone else's audience):
- Newsletters — not pitched
- Podcasts — not pitched
- YouTube reviews — not pitched

### Recommended Launch Sequence

#### Step 1: Pre-Launch Prep (1-2 weeks)
- [ ] Add product screenshot/GIF to homepage (dashboard analytics or widget flow)
- [ ] Get 3-5 beta users to provide testimonials or short quotes
- [ ] Record a 60-second demo video showing: install → add widget → see feedback in dashboard
- [ ] Write a launch blog post: "Why We Built Gotcha — Context Is Everything in Feedback"

#### Step 2: Owned Channels
- [ ] Set up a simple email list (Buttondown or ConvertKit free tier)
- [ ] Write 3 blog posts before launch:
  1. "Why Generic Surveys Kill Your Product Feedback" (searchable)
  2. "How to Add NPS Tracking to Any React Component in 5 Minutes" (searchable, tutorial)
  3. "Build vs. Buy: The True Cost of DIY Feedback Systems" (shareable)

#### Step 3: Product Hunt Launch
- [ ] Prepare PH listing: tagline, 4-5 screenshots, demo video
- [ ] Line up 10+ supporters to upvote and comment on launch day
- [ ] Respond to every comment in real-time on launch day
- [ ] **Tagline ideas:**
  - "Contextual feedback for every component in your app"
  - "NPS, ratings, votes, polls & bug reports — embedded in your React components"

#### Step 4: Rented Channels (Reddit, Twitter/X, Dev.to)
- [ ] Post to r/reactjs, r/webdev, r/SaaS, r/indiehackers
- [ ] Post on Dev.to: tutorial-style "How I Added NPS and Bug Tracking to My React App in 5 Minutes"
- [ ] Twitter/X thread: The story of building Gotcha, what you learned about feedback

#### Step 5: Borrowed Channels
- [ ] Identify 5-10 React/developer newsletters that accept submissions
- [ ] Pitch to podcasts that cover developer tools or indie hacking
- [ ] Reach out to React YouTubers for review/mention

---

## 5. Content Strategy (content-strategy framework)

### Recommended Content Pillars (3 pillars)

**Pillar 1: Product Feedback Best Practices** (searchable)
- "What is contextual feedback?"
- "Feedback surveys vs. in-app feedback: which is better?"
- "How to measure NPS for individual features, not just your whole product"
- "How to collect feedback without annoying users"

**Pillar 2: React Developer Tutorials** (searchable)
- "How to add NPS tracking to a React app"
- "Building a star rating component in React" (leads naturally to Gotcha)
- "How to set up Slack notifications for user feedback"
- "How to export user feedback data for AI analysis"

**Pillar 3: Build vs. Buy / Engineering Decisions** (shareable)
- "The true cost of building your own feedback system"
- "When to use a third-party SDK vs. building in-house"
- "What we learned from our first 10,000 feedback responses"

### SEO Quick Wins
- Target: "react feedback component", "user feedback react", "in-app feedback tool", "contextual feedback", "react NPS component", "react bug report widget"

---

## 6. Free Tool Strategy (free-tool-strategy framework)

### Tool Idea: "React Feedback Component Playground"
- Interactive playground where devs can customize a feedback component and see it live
- Already partially built at /demo — expand with more interactivity
- **Scorecard:** 28/40 — strong candidate

### Tool Idea: "Feedback ROI Calculator"
- Input: team size, hourly rate, expected feedback volume
- Output: Cost of building vs. using Gotcha, time saved, projected insights
- **Scorecard:** 22/40 — promising

---

## 7. Onboarding CRO (onboarding-cro framework)

### Define the Aha Moment
The aha moment for Gotcha is: **Developer installs the SDK, adds it to their app, and sees the first real user feedback come in.**

### Recommendations
- [ ] Add a simple onboarding checklist in the dashboard:
  1. Create your first project
  2. Install the SDK (`npm install gotcha-feedback`)
  3. Add your API key
  4. Receive your first response
- [ ] Send a trigger-based email 24h after signup if they haven't created a project
- [ ] Celebrate first response with an in-dashboard congratulation

---

## 8. Priority Action Plan

### Immediate (This Week)
1. Add a product screenshot or GIF to the homepage hero
2. Get 1-2 early users to give a short quote for social proof

### Next 2 Weeks (Pre-Launch)
3. Write first blog post ("Why We Built Gotcha")
4. Set up basic email list for launch announcements
5. Record 60-second demo video

### Next Month (Launch)
6. Prepare and execute Product Hunt launch
7. Post to Reddit (r/reactjs, r/webdev) and Dev.to
8. Set up dashboard onboarding checklist

### Ongoing
9. Publish 2 blog posts/month (alternating searchable + shareable)
10. Build backlinks through developer community participation
11. Monitor free-to-pro conversion rate and adjust pricing if needed

---

## 9. Competitive Feature Gap Update (March 2026)

Based on the competitive analysis, here's what's been addressed:

| Gap Identified | Status | Notes |
|---|---|---|
| Webhook/API for responses | DONE | Webhooks to Slack, Discord, custom endpoints |
| Slack/Discord notifications | DONE | Built into webhook system |
| NPS/CSAT mode | DONE | `mode="nps"` with 0-10 scale, promoter/passive/detractor |
| Response tagging/status | DONE | New / Reviewed / Addressed statuses, custom tags |
| Element-level benchmarking | DONE | Analytics dashboard with anomaly detection |
| Team access | DONE | Workspaces with Owner/Admin/Member/Viewer roles |
| CSV/JSON export | DONE | With filter forwarding for segment analysis |
| GDPR data deletion | DONE | `DELETE /api/v1/users/:userId` endpoint |
| Bug tracking | DONE | Bug flagging on responses, dedicated bugs page |
| Annual billing | DONE | 17% savings ($24/mo billed annually) |
| AI feedback summaries | NOT STARTED | Still a differentiator opportunity |
| Embeddable score component | IN PROGRESS | `<GotchaScore />` planned |
| Public API for reading responses | PARTIAL | Export API exists, no general-purpose read API yet |
| Framework expansion (Vue, Svelte) | NOT STARTED | Would expand TAM ~30% |

### Updated Feature Comparison vs Competitors

| Feature | Gotcha | Canny | Hotjar | Survicate | Sleekplan |
|---|---|---|---|---|---|
| Contextual/per-component | YES | No | No | No | No |
| React SDK | YES | No | No | No | No |
| Star ratings | YES | No | No | Yes | No |
| Thumbs up/down | YES | No | Yes | Yes | Yes |
| Polls | YES | No | Yes | Yes | No |
| **NPS** | **YES** | No | Yes | YES | YES |
| **Bug tracking** | **YES** | No | No | No | No |
| **Webhooks (Slack/Discord)** | **YES** | Yes | Yes | Yes | Yes |
| **Team workspaces** | **YES** | Yes | Yes | Yes | Yes |
| **CSV + JSON export** | **YES** | Yes | Yes | Yes | Yes |
| **GDPR deletion API** | **YES** | Yes | Yes | Yes | No |
| User segmentation | YES | YES | Yes | Yes | Paid |
| Free tier responses | 500/mo | 25 users | 20/mo | 25/mo | 500K pv |
| Entry paid price | $29/mo | $79/mo | $48/mo | $99/mo | $15/mo |

Gotcha has closed nearly every gap identified in the competitive analysis while maintaining its unique advantages (contextual feedback, React SDK, lightweight footprint, aggressive pricing).

---

## Summary

The product is feature-complete and competitively positioned. The remaining gaps are:
1. **Social proof** — No testimonials or customer logos. This is the biggest conversion blocker.
2. **Product visuals** — No screenshot/GIF of the actual product in use on the homepage.
3. **Content/SEO** — No blog, no email list. Zero organic discovery.
4. **Launch execution** — Product Hunt, Reddit, Dev.to launches haven't happened yet.

The product is ready. The marketing isn't. Focus on social proof + visuals first, then execute the launch sequence.
