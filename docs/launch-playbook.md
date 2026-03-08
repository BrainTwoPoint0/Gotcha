# Gotcha Launch Playbook

> Complete platform-by-platform marketing plan for launching Gotcha across 25+ platforms — $0 budget.

---

## Table of Contents

1. [Master Timeline](#master-timeline)
2. [Product Hunt](#product-hunt)
3. [Hacker News](#hacker-news)
4. [Reddit](#reddit)
5. [Indie Platforms](#indie-platforms)
6. [SaaS Directories](#saas-directories)
7. [Assets to Prepare](#assets-to-prepare)

---

## Master Timeline

### Week 0 — Prep (Before Any Launch)
- [ ] Public GitHub repo for SDK is live with clean README
- [ ] Demo URL works and loads fast (under 2 seconds)
- [ ] npm page (`gotcha-feedback`) has description, keywords, and badge — v1.1.0 published
- [ ] Record 30-60 second demo GIF (widget appearing on a React app, user clicking stars, NPS score, submitting)
- [ ] Create 5-6 gallery images for Product Hunt (see Assets section)
- [ ] Clean pricing screenshot (Free vs Pro with annual toggle)
- [ ] Build 30 days of Reddit comment history (if needed)
- [ ] Set up keyword alerts (F5Bot or similar) for: "feedback widget," "collect user feedback," "Typeform alternative," "product feedback React," "NPS React component"

### Week 1 — Directory Submissions (Low Effort)
- [ ] Submit to **AlternativeTo** — list as alternative to Canny, Hotjar, UserVoice, Intercom, Survicate
- [ ] Submit to **SaaSHub** — complete listing with screenshots and pricing
- [ ] Submit to **TinyLaunch** and **SideProjectors** (10 min each)
- [ ] Submit to **Betalist** (free queue = 2-4 weeks, or $129 for featured)
- [ ] Submit to **Fazier** and **Tiny Startup**

### Week 2 — Community Warm-Up
- [ ] Create **Indie Hackers** product page (listing only, not the big post yet)
- [ ] Submit to **Microlaunch** — start engaging with community
- [ ] Post teaser content on Twitter/X about the problem Gotcha solves
- [ ] Warm up personal network: "I'm launching next week, would love your support"

### Week 3 — Main Launch Week
- **Monday:** Publish **Indie Hackers** "Show IH" post
- **Tuesday:** Post **Show HN** on Hacker News (9 AM ET)
- **Wednesday:** Launch on **Uneed** — coordinate network to vote
- **Thursday:** Post on **r/SideProject** (Reddit)
- **Friday:** If Betalist featured is paid, schedule here to ride momentum

### Week 4 — Reddit Wave
- [ ] Post educational angle to **r/webdev**
- [ ] Post "asking for feedback" angle to **r/reactjs** Show & Tell thread
- [ ] Launch on **Peerlist** with personal "I built this" narrative
- [ ] Submit to **Startup Stash** and **FounderList**

### Week 5 — Product Hunt
- [ ] Launch on **Product Hunt** (Tuesday/Wednesday/Thursday, 12:01 AM PST)
- [ ] Full launch day execution (see Product Hunt section)

### Week 6 — Follow-Through
- [ ] Post to **r/indiehackers** and **r/SaaS** with traction update
- [ ] Return to Indie Hackers with milestone post: "30 days since launch"
- [ ] Post Product Hunt recap on Twitter/X

### Ongoing
- [ ] Monitor keyword alerts, engage authentically in relevant threads
- [ ] Ask early users to vote on AlternativeTo ("I use this")
- [ ] Submit to **PeerPush** if time allows

---

## Product Hunt

### Pre-Launch Prep

**2 weeks before:**
- Record 60-90 second demo GIF/video showing: install SDK → add `<Gotcha />` → feedback appears → view in dashboard
- Set up `/launch` page or "Upvote us on PH" CTA
- Ensure live demo at `/demo` works without sign-up — includes NPS mode
- Prepare PH profile: photo, bio, links
- Draft all copy (below)
- Design gallery images (see Assets)
- Build list of 20-30 people to DM on launch day
- Pre-schedule 3-5 launch tweets

**1 week before:**
- Submit PH draft, review everything
- Schedule for **Tuesday, Wednesday, or Thursday**
- Launch time: **12:01 AM PST** (maximizes 24-hour window)
- Reach out to network: "I'm launching next [day], will send a link when live"
- Schedule launch-day email for 8 AM PST (if newsletter exists)
- Pre-write maker comment (post within 60 seconds of going live)

**Day before:**
- End-to-end check of demo and npm install flow
- Triple-check gallery images in PH draft
- Write all personal outreach messages (send manually when live)
- Set alarm for 11:55 PM PST
- Clear schedule for launch day

### Tagline Options (under 60 chars)

1. **Feedback that lives where users actually experience it** — recommended
2. NPS, ratings, votes & bugs — embedded in React components
3. Stop guessing which feature users hate. Ask them there.
4. Contextual feedback SDK — no surveys, no portals
5. 5 feedback modes for any React component. 3 lines of code.

### Short Description (under 260 chars)

```
Gotcha lets you embed star ratings, NPS scores, thumbs up/down, polls, and bug
reports directly into React components. Users give feedback where they experience
your features. 5 modes, team workspaces, Slack webhooks. 3 lines of code.
```

### Maker Comment (First Comment)

```
Hey Product Hunt! I'm Karim, the maker of Gotcha.

The problem that drove this: I kept getting feedback like "the app feels slow"
or "the dashboard is confusing" — but I had 4 dashboards and no idea which one
users meant. Traditional tools (Canny, Intercom surveys, Typeform) collect feedback
at the page or session level. By the time a user fills out a survey, they've
forgotten the exact moment of frustration.

Gotcha is different: you attach feedback directly to a component.

  <GotchaProvider apiKey="your-key">
    <Gotcha elementId="checkout" mode="nps" />
    <Gotcha elementId="search" mode="vote" />
    <Gotcha elementId="pricing" mode="feedback" />
  </GotchaProvider>

That's it. Five feedback modes — star ratings, thumbs up/down, NPS (0-10),
custom polls, and bug reports — right there, in context, at the moment of
experience.

What I've built:
- React SDK (~15KB, tree-shakeable), published as `gotcha-feedback` on npm
- Dashboard with analytics, element benchmarking, and anomaly detection
- Team workspaces with roles (Owner, Admin, Member, Viewer)
- Webhooks to Slack, Discord, or custom endpoints
- Export to CSV/JSON with filters for AI analysis
- GDPR data export and deletion API
- Free tier: 500 responses/month, 1 project
- Pro: $29/month (or $24/month annual), unlimited everything

I'd love your honest feedback — especially from anyone who's struggled with vague
user feedback or low survey response rates. What would make this more useful
for your stack?

— Karim
```

### Hunter Strategy

**Self-hunt.** For a developer tool, self-hunting reads as genuine. PH's algorithm weights upvotes/engagement/comment quality far more than who submits. You control exact launch time and all metadata.

### Launch Day Hour-by-Hour

| Time (PST) | Action |
|---|---|
| 12:01 AM | Submit product. Post maker comment within 60 seconds. First tweet. |
| 12:01-2:00 AM | Send personal DMs to top 10-15 people. Say "check it out" not "upvote." Post on IH if active there. |
| 6:00-9:00 AM | Send newsletter email (8 AM). Post in active Slack communities. Reply to every PH comment. |
| 9:00 AM-12:00 PM | Twitter/X thread (problem -> solution -> PH link). Post in r/reactjs and r/SideProject if you have history. |
| 12:00-5:00 PM | Peak traffic. Stay online. Reply to every comment within 15 minutes. "Midday update" tweet. |
| 5:00-11:59 PM | Final push tweet. Thank commenters. Personal thank-you DMs to substantive commenters. |

### Post-Launch

- **Day after:** Launch recap on Twitter/X and Indie Hackers (upvotes, comments, signups, one unexpected insight)
- **Week after:** Personally reach out to substantive PH commenters (warm leads). Post "what I learned from my PH launch" on IH.
- **Long-term:** Add "Featured on Product Hunt" badge to site + README. Use PH comments as testimonials.

---

## Hacker News

### Show HN Post

**Title:**
```
Show HN: Gotcha – Contextual feedback SDK for React (ratings, NPS, votes, polls, bugs)
```

**Body:**
```
Gotcha is a React SDK that lets you collect user feedback directly inside your
components — star ratings, NPS scores, thumbs up/down, polls, or bug reports —
without redirecting users to a survey.

Integration is a wrapper component:

  <GotchaProvider apiKey="your-key">
    <Gotcha elementId="checkout" mode="nps" />
    <Gotcha elementId="search" mode="vote" />
  </GotchaProvider>

A small feedback button appears on the component. Responses are aggregated
in a dashboard with element-level benchmarking and anomaly detection.

Bundle is ~15KB gzipped. No dependencies outside React. The button auto-detects
system theme (dark/light). API endpoint returns immediately; DB writes are async.

Other features: team workspaces with roles, webhooks to Slack/Discord, CSV/JSON
export with filters, GDPR deletion API.

Free tier: 500 responses/month, 1 project. Pro: $29/month, unlimited.

npm: gotcha-feedback
Demo: gotcha.cx/demo
```

### Full Narrative Post (Alternative)

**Title:**
```
I built a React feedback SDK because Typeform surveys had 2% response rates
```

**Body:**
```
For the last two years I've been copy-pasting the same feedback collection setup
into every project: Typeform embed, or Intercom survey, or a mailto: link. The
conversion rates were consistently bad (~2-4%) and the qualitative data was shallow.

The insight: feedback quality is inversely proportional to the time and distance
between the experience and the feedback request.

Gotcha (gotcha-feedback on npm) is a React wrapper component. You put it around
any component and a feedback button floats on it. Five modes: star ratings,
thumbs up/down, NPS (0-10), custom polls, and bug reports.

Technical decisions worth discussing:

**Bundle size**: Started at ~40KB. Removed date picker, switched from third-party
modal to React portal with inline styles -> ~15KB gzipped.

**Theme detection**: Synchronous detection before hydration to avoid flash-of-wrong-theme.

**API latency**: Response endpoint validates payload and returns 200 immediately.
DB write is async. User-facing latency under 100ms.

**Webhooks**: Real-time delivery to Slack/Discord/custom endpoints with retry
logic and failure tracking.

**NPS**: 0-10 scale with automatic promoter/passive/detractor classification
and score calculation in the analytics dashboard.

**Teams**: Workspace model with roles (Owner, Admin, Member, Viewer). Workspace
switcher for users in multiple orgs.

Curious whether contextual feedback is something people find useful, or if the
problem is better solved by better survey UX.
```

### HN Timing & Tactics

- **When:** Tuesday/Wednesday/Thursday, 9:00-10:00 AM ET
- **First 30 minutes are critical** — respond to first 3-5 comments within 10-15 min
- **Never post on:** Friday afternoon, same day as major tech announcements

### Prepared Responses to Likely HN Comments

**"How is this different from Hotjar/FullStory?"**
> Hotjar and FullStory are session replay — passive observation. Gotcha is active: users explicitly rate a specific component. Session replay tells you what users did; contextual feedback tells you what they thought. They're complementary.

**"Seems like this could be a custom hook"**
> Fair — you could build this with a hook + portal. Gotcha saves you the button design, modal, API endpoint, dashboard, analytics, webhooks, team management, and NPS calculations. If you want full control, roll your own. The SDK is for shipping in 5 minutes rather than 2 weeks.

**"What about GDPR/privacy?"**
> Responses tied to anonymous session ID by default — no PII unless the user types it. You can pass a userId prop to correlate to authenticated users (opt-in). We have a GDPR deletion API (`DELETE /api/v1/users/:userId`) that removes all data for a specific end user. You're the data controller, Gotcha is the processor.

**"Why only React?"**
> React-first because that's what I use and I wanted the DX to be perfect — actual React components, not script-tag injection. Vue and Svelte support is on the roadmap. The API and dashboard work with any frontend if you POST directly.

**"NPS on individual components? That seems weird."**
> Traditional NPS asks "would you recommend this company?" which is too broad to be actionable. Per-component NPS tells you "users are promoters of your search but detractors of your checkout." That's specific enough to act on. You can also use it at the page level — just put it on the page layout.

### What Gets You Upvoted on HN
- Genuinely interesting technical decisions explained clearly
- Honest numbers (bundle size, response rates)
- Willingness to say "I don't know"
- A demo that works on the first click

### What Gets You Downvoted on HN
- Marketing language ("revolutionize," "game-changing," "seamless")
- Vague claims without numbers
- Defensiveness in comments
- Responding with a sales angle

---

## Reddit

### Subreddit Priority

| Tier | Subreddit | Members | Best Post Type | When |
|------|-----------|---------|----------------|------|
| 1 | r/reactjs | 300k+ | Show & Tell / technical | Week 4 |
| 1 | r/webdev | 900k+ | Educational, value-first | Week 4 |
| 1 | r/SideProject | 200k+ | "I built this" + story | Week 3 |
| 1 | r/indiehackers | 150k+ | Lessons learned / traction | Week 6 |
| 2 | r/SaaS | 100k+ | Problem/solution | Week 6 |
| 2 | r/startups | 1M+ | Self-Promo Saturday or discussion | Week 6 |
| 2 | r/javascript | 200k+ | Technical deep dive on SDK internals | Optional |

### Post Template A — "I Built This" (r/SideProject, r/indiehackers)

**Title:**
```
I got sick of context-switching to Typeform every time I needed product feedback,
so I built a React SDK that lets users rate features right where they use them
```

**Body:**
```
For the past year I've been adding Typeform links, Intercom popups, and email
surveys to every SaaS I worked on. The conversion rate was terrible. Users had
already forgotten what they wanted to say by the time the survey loaded.

So I built Gotcha.

It's a React SDK (gotcha-feedback on npm) that lets you wrap any component with
a feedback trigger. Star ratings, NPS scores, thumbs up/down, polls, or bug
reports — all rendered right inside your UI, in context.

  <GotchaProvider apiKey="your-key">
    <Gotcha elementId="checkout" mode="nps" />
    <Gotcha elementId="search" mode="vote" />
  </GotchaProvider>

Some decisions I made:
- Kept the bundle under 15KB. No dependency bloat.
- Glassmorphism button that works on dark and light themes without config
- API returns immediately — DB writes are async, no latency hit on the user
- Team workspaces with roles so your whole team can see feedback
- Webhooks to Slack/Discord so you never miss a response
- Export to CSV/JSON with filters for feeding data into AI for analysis
- Free: 500 responses/month, 1 project. Pro: $29/month unlimited.

Demo: [link]
npm: gotcha-feedback

Honest question: how are you currently collecting feedback on specific features?
Curious if this solves a real problem.
```

### Post Template B — Educational (r/webdev, r/SaaS)

**Title:**
```
Why in-context feedback beats surveys every time (and how to implement it in React)
```

**Body:**
```
There's a well-documented UX problem: by the time a user reaches your survey,
they've mentally moved on from the feature they just used.

Feedback quality degrades rapidly with time and distance from the experience.

The fix is contextual feedback — collect it right where the experience happens.

  npm install gotcha-feedback

  import { GotchaProvider, Gotcha } from 'gotcha-feedback'

  <GotchaProvider apiKey="your-key">
    <PricingTable />
    <Gotcha elementId="pricing" mode="nps" />
  </GotchaProvider>

A subtle feedback button appears on the component. Responses land in your
dashboard. Five modes: star ratings, NPS (0-10), thumbs up/down, polls, and
bug reports.

Other features that matter:
- Webhooks to Slack/Discord (get pinged when feedback arrives)
- Team workspaces with roles
- Export to CSV/JSON for analysis
- GDPR deletion API

The SDK is gotcha-feedback on npm. Free tier covers most indie projects (500/mo).
Happy to answer implementation questions.
```

### Post Template C — Asking for Feedback (r/reactjs)

**Title:**
```
Built a contextual feedback SDK for React — 5 modes, team workspaces, Slack
webhooks — looking for honest critique
```

**Body:**
```
I've been quietly using this on my own projects and recently published v1.1.0.
Before I invest more in marketing, I want to make sure the DX is good.

  <GotchaProvider apiKey="your-key">
    <Gotcha
      elementId="feature-card"
      mode="feedback"        // or "vote", "nps", "poll"
      theme="auto"
      size="sm"
      position="inline"
    />
  </GotchaProvider>

What's in the box:
- 5 modes: star ratings, thumbs up/down, NPS (0-10), polls, bug reports
- Team workspaces with Owner/Admin/Member/Viewer roles
- Webhooks to Slack, Discord, or custom endpoints
- Export to CSV/JSON with filter forwarding
- Element-level analytics with benchmarking
- ~15KB bundle, no deps outside React

Questions:
1. Does the API feel natural, or would you design it differently?
2. Is 15KB too heavy for a feedback widget?
3. Would you reach for this or build something yourself?
4. Any modes/features obviously missing?

Demo: [link] | npm: gotcha-feedback

Not here to pitch — genuinely want to know if this is worth pursuing. Be brutal.
```

### Reddit Rules

**DO:**
- Spend 1 week commenting genuinely before posting anything
- Reply to every comment within first 2 hours
- Space posts 5-7 days apart across subreddits
- Disclose you built it when mentioning Gotcha in comments

**DON'T:**
- Create new accounts to post
- Upvote with alt accounts (shadowban risk)
- Post same content verbatim across subreddits
- Use emojis/rockets in titles
- Post and disappear
- Delete negative comments — respond thoughtfully

**Timing:** Tuesday-Thursday, 9:00-10:30 AM ET or 12:00-1:00 PM ET

---

## Indie Platforms

### Priority Ranking

| Rank | Platform | Effort | Impact | Notes |
|------|----------|--------|--------|-------|
| 1 | **Indie Hackers** | High | Highest | 500k+ members, your exact audience. Story-driven posts. |
| 2 | **Uneed** | Medium | High | "Product of the Day" badge, 24hr voting window |
| 3 | **Betalist** | Low | High | 1M+ newsletter. $129 featured = worth it. |
| 4 | **Peerlist** | Medium | Medium | Developer-heavy. Personal "I built this" narrative. |
| 5 | **Microlaunch** | Medium | Medium | Small but surgical — every viewer is a potential customer. |
| 6 | **Fazier** | Low | Medium | Newsletter inclusion, long-tail SEO |
| 7 | **Tiny Startup** | Low | Medium | Curated newsletter, high audience quality |
| 8 | **SideProjectors** | Low | Low | 15 minutes, decent SEO |
| 9 | **TinyLaunch** | Low | Low | Pure SEO/directory play |

### Platform-Specific Copy

**Indie Hackers:**
> I was tired of feedback forms nobody fills out, so I built an SDK that asks users in context.
>
> The problem with feedback portals is they're separated from the moment of experience. Gotcha is a React SDK (`gotcha-feedback` on npm) that embeds star ratings, NPS scores, thumbs up/down, polls, and bug reports directly in your components.
>
> 3 lines of code. 15KB. Team workspaces. Slack webhooks. Export to CSV/JSON.
>
> Free tier: 500 responses/month. Pro: $29/month (or $24/month annual).
>
> What would make you actually integrate this into your app?

**Uneed:**
> Embed feedback widgets into React components in 3 lines of code. 5 feedback modes (ratings, NPS, votes, polls, bugs). Team workspaces, Slack webhooks, CSV/JSON export. 15KB SDK. Free tier: 500 responses/month. Pro: $29/month.

**Betalist:**
> Contextual feedback for React apps — right where your users experience features. 5 modes: star ratings, NPS, thumbs up/down, polls, bug reports. Team workspaces with roles, Slack/Discord webhooks, data export. 3 lines of code, 5-minute setup. Published on npm as `gotcha-feedback`.

**Microlaunch:**
> The feedback SDK indie hackers actually finish integrating. Install from npm, drop `<Gotcha elementId="..." mode="nps" />` into any component, and start collecting NPS scores, star ratings, votes, polls, or bug reports. 15KB, team workspaces, Slack webhooks, free tier, $29/mo Pro.

**Peerlist:**
> I built Gotcha because I kept building feedback forms nobody filled out. It's a React SDK that embeds feedback directly into your components — users rate features where they use them. 5 modes including NPS and bug reports. Team workspaces, Slack webhooks, data export. Free + Pro at $29/mo.

---

## SaaS Directories

### Priority Ranking

| Rank | Platform | SEO Value | Audience Fit | Verdict |
|------|----------|-----------|--------------|---------|
| 1 | **AlternativeTo** | Very High | High | **Submit now** — ranks for "[X] alternative" searches |
| 2 | **SaaSHub** | High | High | **Submit now** — DA 60+, email digests |
| 3 | **Startup Stash** | Moderate | Moderate | Submit after top 2 |
| 4 | **FounderList** | Low | High | Submit — mini Product Hunt format |
| 5 | **PeerPush** | Low | Moderate | Submit if active in community |
| 6 | **LaunchIgniter** | Uncertain | Moderate | Marginal — only if truly one-click |
| 7 | **TrustMRR** | Low | Low (now) | **Skip** — revisit when you have MRR to show |
| 8 | **Versily** | Very Low | Moderate | **Skip** — check back in 12 months |
| 9 | **Dang AI** | Zero | None | **Hard skip** — AI-only directory, Gotcha isn't AI |

### AlternativeTo (Highest Priority)

List as alternative to: **Canny, UserVoice, Hotjar, Intercom, Survicate, Typeform**

```
Gotcha — Contextual feedback SDK for React developers

Gotcha lets you embed star ratings, NPS scores, thumbs up/down votes, polls,
and bug reports directly inside your React components. Feedback happens where
users experience your product, not in a separate survey portal they never open.

3 lines of code. 5-minute setup. Ships in 15KB.

Team workspaces with roles, webhooks to Slack/Discord, CSV/JSON export,
GDPR deletion API.

Free tier: 500 responses/month, 1 project.
Pro: $29/month (or $24/month annual), unlimited everything.
```

### SaaSHub

```
Gotcha — Contextual Feedback SDK for React

Embed feedback collection directly into your React app with 3 lines of code.
Unlike Canny or Hotjar, Gotcha isn't a separate portal — it lives inside your
components. 5 modes: star ratings, NPS, votes, polls, bug reports.

Team workspaces, Slack/Discord webhooks, CSV/JSON export, GDPR API.

Install: npm install gotcha-feedback

Free: 500 responses/month, 1 project
Pro: $29/month, unlimited
```

### FounderList (Personal Voice)

```
I built Gotcha because I was tired of sending surveys nobody fills out.

Gotcha is a React SDK that embeds feedback directly into your app components.
Your users rate features where they experience them — with star ratings, NPS
scores, votes, polls, or bug reports.

npm install gotcha-feedback
3 lines of code. Works in 5 minutes.

Plus: team workspaces, Slack webhooks, data export, GDPR API.

Free tier available. $29/mo for unlimited responses.

Would love feedback from anyone who's struggled with product signal at the early stage.
```

---

## Assets to Prepare

### Must-Have Before Any Launch

1. **Demo GIF** (30-60 seconds) — Widget appearing on a React app -> user clicks stars -> submits -> success state. Also show NPS mode (0-10 scale).
2. **Gallery images** (1270x760px for PH):
   - **Thumbnail:** Dark bg, Gotcha logo + 3-line code snippet + "Contextual feedback for React"
   - **Image 1 — The Problem:** Split screen: empty Canny board vs Gotcha widget on a component. "Feedback at the feature is signal."
   - **Image 2 — 5 Modes:** Show all five modes side by side — star ratings, NPS, thumbs up/down, polls, bug report
   - **Image 3 — Integration Code:** VS Code dark theme, 3-line wrap with callouts: "1. Install", "2. Wrap", "3. Done"
   - **Image 4 — Dashboard:** Screenshot of analytics with element benchmarking, NPS scores, anomaly detection
   - **Image 5 — Team & Integrations:** Workspace switcher + Slack webhook notification example
   - **Image 6 — Pricing:** Clean Free vs Pro comparison with annual toggle
3. **Pricing screenshot** — Clean visual of tiers with annual savings shown
4. **npm badge** — Weekly download count (even small numbers = social proof)
5. **One-liner** (memorize this): "5 feedback modes for any React component — NPS, ratings, votes, polls, bugs. 3 lines of code, 15KB."

---

## Key Principles Across All Platforms

1. **Lead with the problem, not the product.** "Surveys suck because users forget" -> "That's why Gotcha exists"
2. **Be technical with developers.** Mention npm, bundle size, React portals, async DB writes, webhook delivery.
3. **Be personal everywhere.** "I built this because..." outperforms "We're excited to announce..."
4. **Highlight the full platform.** Don't just say "feedback widget" — mention NPS, bug reports, team workspaces, Slack webhooks, export. The feature set is now competitive with tools 3-5x the price.
5. **Respond to everything.** Every comment, every question, within 2 hours. This is your biggest lever.
6. **Never say "upvote."** Say "check it out" or "would love your feedback."
7. **Don't launch everywhere at once.** Stagger over 6 weeks. Each launch feeds the next.
8. **Honest numbers always.** 15KB, 500 free responses, $29 Pro ($24 annual), 5-minute setup, 5 modes — specificity builds trust.
