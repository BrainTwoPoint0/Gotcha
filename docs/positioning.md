# Gotcha Positioning & Phase Plan

Supersedes the earlier `posthog-positioning.md` draft. That framing ("PostHog structurally cannot follow") was shown to be wrong under prior-art review — PostHog already has a public roadmap with voter-notify, and the deep "loop" territory is owned by Canny, Featurebase, Nolt, Frill. Reframing around what is actually true.

## Who the target buyer actually is

Small-team founders and indie developers (2-20 people) who have shipped a React web app and want user feedback. They already have analytics (PostHog, Plausible, Mixpanel, or similar). They're skeptical of adding tools. They pick tools on **aesthetic, principle, and ease-of-install** — the same buyer who pays for Linear over Jira, Raycast over Alfred, Arc over Chrome.

## Honest competitive picture

**Canny owns the feedback-loop category.** ~$3.5M ARR, 50K+ companies, the full pipeline (status lifecycle, voter-notify, public roadmap, changelog). They are the market leader, they are expensive at volume (£500+/mo once you hit real usage), and they are visually dated — an admin panel from 2018. That last point is our opening.

**PostHog has an adjacent feature set.** Built-in surveys, a public roadmap, voter-notify. For a team already running PostHog, adding a second tool for "just feedback" is a real objection — unless the second tool does something PostHog's surveys clearly don't. Notably: PostHog's surveys are data-shaped (events in a stream, triggered by flags). They don't do the relationship layer well. But "PostHog structurally can't follow" is overstatement; PostHog *chooses* not to invest there today.

**Privacy-first feedback is actually a gap.** Plausible and Fathom own privacy-first analytics. Userback markets GDPR compliance as a checkbox. No one owns "feedback without surveillance" as a core identity — but it is also **low-urgency** for most feedback-tool buyers, because users volunteer feedback. Validate this wedge with real prospects before betting the roadmap on it.

**Editorial aesthetic is a real signal — but a signal, not a wedge.** Linear's adoption was driven by aesthetic + speed + command palette, together. Figma beat Adobe XD on design + collaboration, together. Aesthetic opens doors; it does not close deals on its own. We need the product to back it up.

## Positioning (what we actually claim)

Headline — works without competitor framing, leads with the product claim:

> **Where your users talk to you, and you talk back — without tracking them.**

One-line elevator: "A feedback SDK and dashboard that closes the loop with your users. No analytics. No cookies. No tracking. Built for small teams that care how things feel."

### What we are
- A feedback SDK (React today, framework-agnostic later) that captures ratings, votes, NPS, polls, and bug reports on any UI component
- A dashboard that turns submissions into themes, tracks them through a status lifecycle, and notifies submitters when you ship
- A privacy posture backed by an auditable SDK (no third-party calls, no cookies, no fingerprinting on view)

### What we are NOT
- Not analytics. We do not track page views, funnels, cohorts, or retention.
- Not session replay, heatmaps, or feature flags.
- Not a help desk or support inbox.
- Not an enterprise product. Small teams over enterprise every time.

### Why someone buys us over Canny
1. **Aesthetic + taste.** Canny is the feature set; Gotcha is the feature set in a product that looks like it belongs next to Linear. For founders who've rejected Canny on look alone, we are the option.
2. **Privacy posture.** Canny sets cookies, calls third-party scripts, fingerprints for dedupe. Gotcha does none of these. For founders who have had a privacy conversation with their customers, this matters.
3. **AI-synthesis as the default dashboard view.** Not a reporting tab — the front page is "here's what the AI found this week." Canny hides this behind drill-downs.

### Why someone buys us alongside PostHog
Because PostHog tells them *what* users did. Gotcha is the *conversation* with those users — a different job, not a second analytics tool. The two-tool objection is softened by category separation: "your surveys are events; our feedback is a relationship."

## Wedges, ranked by defensibility

1. **Aesthetic + product taste.** (Most defensible. Hardest to copy — design debt compounds.) The editorial direction + consumer-grade embed + forthcoming dashboard overhaul form one coherent visual identity that Canny structurally cannot ship without dismantling their product.
2. **Privacy posture.** (Defensible, but validate demand.) Auditable SDK + zero third-party + no fingerprinting is a real technical moat. The open question is whether buyers actually pay for it. **Action: interview 5-10 Canny users (or ex-Canny users) before Phase 2 commits. If privacy doesn't move their decision, demote it to a proof-point, not a headline.**
3. **AI-synthesis-first dashboard.** (Defensible for 6-12 months.) Granola-style "AI is the default view, not a tab" is the direction the market is moving. Canny is slow to rebuild their dashboard — we have a window.
4. **The loop.** (Least defensible as wedge.) Canny does it. Featurebase does it. PostHog has pieces of it. We ship it because it is table stakes, not because it differentiates. Treat as a feature we must have, not as a story we tell.

## Phase plan

### Phase 1 — Landing page repositioning ✅ (shipped locally)
Editorial design system installed. Hero, Install, Loop, Privacy, CTA sections rewritten. Navbar + Footer editorially re-skinned. SDK privacy leak closed (v1.1.13 built, awaiting publish). Awaiting the three post-review fixes below before commit.

**Post-review fixes (this session):**
- A11y: `.animate-page-turn` blank-hero bug under `prefers-reduced-motion`
- Robustness: clipboard `handleCopy` try/catch
- Design: demote privacy caveat from synthesis-card pattern (signature dilution)
- UX: tighten hero deck + qualify JS errors disclosure

### Phase 2 — Dashboard / product UI overhaul
Propagate the editorial design system into the dashboard + auth surfaces. Prerequisite for Phase 3 and Phase 4 to look credible. Biggest chunk of work on the plan.

### Phase 3 — The loop MVP
Feedback status lifecycle (`new → planned → building → shipped`), notify-back email, public roadmap page per project. Designed natively into the Phase 2 dashboard, not bolted on.

### Phase 4 — AI synthesis as default dashboard view
Themes card, trend card, table demoted. This is the "default view is synthesis" wedge.

### Phase 5 — Linear/GitHub shipping integrations
Deferred until the above are validated.

## Validation asks (on the user, not on me)

1. **Before Phase 2 finishes:** interview 5-10 Canny users or ex-Canny users about whether privacy-first feedback would change their buying decision. If "not really," demote the privacy wedge from headline to proof-point in copy and rework the headline.
2. **Before Phase 3 ships:** confirm the target buyer actually wants a *public* roadmap (some founders do, some find it embarrassing). Make it opt-in per project with a sensible default.
3. **Before Phase 4 ships:** decide what "AI synthesis" actually generates. Themes is the obvious answer; sentiment trajectory, repeat-submitter detection, and feature-request clustering are the interesting answers.

## Aesthetic direction (decided)

Editorial warmth with engineering precision — Stripe Press meets Linear's grid. Decided by `premium-ui-designer`, validated against Linear / Granola / Plausible / Stripe Press. Implemented. Design system summary:

**Typography** — Fraunces display serif (Tiempos Headline if budget opens), Inter body, JetBrains Mono.
**Color (7 tokens)** — ink `#1A1714`, paper `#FAF8F4`, accent `#D4532A` burnt sienna, neutral-2 `#E8E2D9`, neutral-3 `#6B655D`, success `#4A6B3E` sage, alert `#9B3A2E`.
**Spacing** — 4pt base, favor 32/48. **Radius** — 4/8/12. **Motion** — 240ms ease-out, opacity + 4px translate, respects reduced-motion.
**Signature element** — the synthesis card (serif pull-quote + hairline + accent dot). Appears ONCE per page. This is the dashboard's equivalent of the embed's glass-G signature.
**Guardrails** — no serif body, no beige-on-beige, no decorative flourishes.

## Phase 1 — Review (2026-04-14)

**Four-specialist pressure test.** After implementation, ran parallel review with `prior-art-researcher`, `ux-expert`, `premium-ui-designer`, `senior-code-reviewer`.

**Strategic findings:**
- "PostHog structurally can't follow" claim broken under scrutiny — they have the feature. Reframed above.
- "The loop as differentiation" is crowded — Canny owns it. Reframed as table stakes, not wedge.
- Privacy wedge is real gap in feedback-tool space but low-urgency; validate with prospects.
- Editorial aesthetic is signal, not substance; it opens doors, doesn't close deals alone.

**UX findings:**
- Hero deck buries the job-to-be-done under poetry. Name the object in sentence one.
- Loop section's synthesis card reads as authored-not-captured — will want a real product screenshot once the dashboard overhaul lands in Phase 2.
- Privacy caveat works; qualify "recent JS errors" as opt-in.
- Sequencing Hero → Install → Loop → Privacy → CTA is correct.

**Design findings:**
- Typography, color, spacing, motion, guardrails all matched brief.
- Signature synthesis-card pattern used twice (Loop + Privacy caveat) — dilutes. Demote Privacy caveat to plain inset paragraph.

**Code findings:**
- Editorial token architecture + `@layer components` cascade fix correct.
- `rgb(var(--token) / <alpha-value>)` pattern correct.
- Five `next/font` imports acceptable (route-scoped CSS, swap display).
- SDK privacy fix correct, idempotent, no stale references.
- **Two bugs to fix:** reduced-motion blanks the hero; `handleCopy` missing try/catch.
- Delete orphaned `HomepageDemo.tsx`.

## Success signals

- **Landing:** direct mentions of "editorial," "Canny-but-prettier," or "I'd rather look at this than [incumbent]" in inbound.
- **The loop:** % of submissions with a status other than `new`; % of submitters who receive a notify email; notify-email click-through.
- **Privacy:** direct mentions in signup flow or sales conversations; do prospects cite it as a reason they chose us?
- **AI synthesis:** % of weekly-active projects that open the themes view at least once.
