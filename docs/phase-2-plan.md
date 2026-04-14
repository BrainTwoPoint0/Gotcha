# Phase 2 — Dashboard & Product UI Overhaul

Prerequisite container for Phase 3 (the loop) and Phase 4 (AI synthesis). The landing page now makes claims the dashboard must visually back up. If Phase 2 is half-done when Phase 3 ships, the loop feature lands on top of a generic SaaS admin panel and undermines the whole positioning.

**Constraint named up front:** weeks, not months. If week 1 only touches the nav, that is the signal to narrow scope, not to extend the timeline. Ship a smaller surface editorially-beautifully rather than a bigger surface editorially-halfway.

## Target surfaces (full inventory)

From `apps/web/app/(dashboard)/dashboard/`:

- `/dashboard` — root landing after login
- `/dashboard/projects` — project list
- `/dashboard/projects/new` — create project
- `/dashboard/projects/[slug]` — project detail
- `/dashboard/projects/[slug]/settings/metadata` — project settings
- `/dashboard/projects/[slug]/webhooks` — webhook config
- `/dashboard/responses` — response table
- `/dashboard/analytics` — analytics view
- `/dashboard/insights` — insights (internal-only per .gitignore)
- `/dashboard/bugs` + `/dashboard/bugs/[id]` — bug reports
- `/dashboard/settings` — workspace settings

From `apps/web/app/(auth)/`:

- `/login`
- `/signup`

## Scope by week (aggressive)

### Week 1 — Shell + one core view

**Goal:** anyone who lands in the dashboard feels the editorial direction within 2 seconds, even if they never navigate beyond the first screen.

- `(dashboard)/layout.tsx` — editorial shell: sidebar or top-nav, breadcrumbs, consistent page chrome. Apply `.editorial` via layout, not per-page.
- Dashboard nav component — editorial wordmark, mono eyebrows for section headers, hairline rules instead of boxed cards.
- `/dashboard/responses` (the canonical core view) — editorial table treatment: paper background, hairline rows, ink headers, mono timestamps, one accent-colored action per row. Empty state, loading state, error state all designed.
- Auth: `/login` and `/signup` — editorial forms (generous whitespace, Fraunces headline per page, Inter body, one accent CTA, clear error states).
- Design system file for shared primitives — `app/(dashboard)/components/editorial/{Button,Table,Card,EmptyState,FormField}.tsx` — extracted from the landing page patterns.

**Gate for week 1 done:** screenshot the shell + responses + login. Show three specialists (premium-ui-designer, ux-expert, senior-code-reviewer) in parallel. Any blockers fixed before week 2.

### Week 2 — Remaining product views

- `/dashboard/projects` list + detail views — editorial cards with hairline dividers, accent status dots, serif project names.
- `/dashboard/projects/[slug]/settings/metadata` + `/webhooks` — settings form pattern: paper background, ink labels, hairline input borders, mono code blocks for webhook URLs / API keys.
- `/dashboard/analytics` — editorial chart treatment. Keep the data; restyle the containers. Axes in neutral-3, bars/lines in ink with one accent for the latest period.
- `/dashboard/bugs` + `/dashboard/bugs/[id]` — bug list table (same pattern as responses) + detail view with embedded screenshot rendering.
- `/dashboard/settings` — workspace / billing / API keys editorially re-skinned.

**Gate for week 2:** second parallel specialist review. Every dashboard surface must render in `.editorial` — no legacy shadcn tokens leaking through.

### Week 3 — States + polish + verification

- Every surface: empty state, loading state, error state. These are what ship-quality dashboards get right and "AI-generated" ones skip.
- 404 + root error boundary in editorial style.
- Dark mode — decide: support it, or ship explicit light-mode-only? Editorial warmth tends to fight dark mode. Recommendation: **light only for v1**, with a dark-mode pass deferred to post-loop. Document the decision.
- Accessibility pass — `prefers-reduced-motion` on every animation (lesson from the landing a11y bug), keyboard navigation for the new table/card patterns, focus rings in accent burnt sienna, ARIA labels on icon-only buttons.
- Responsive pass — dashboards are the thing people open on laptops, but the mobile experience cannot be broken.
- Delete the legacy shadcn tokens from the dashboard surface (keep in config for signup/login if they haven't been migrated, otherwise remove from `globals.css`).

**Gate for week 3:** `/check-ready` + visual QA + full multi-reviewer sweep (senior-code-reviewer + ux-expert + premium-ui-designer).

## Non-scope (explicit)

- No new features. This is a repaint, not a redesign of product behavior.
- No data model changes.
- No routing changes beyond what's required for the editorial layout.
- No dark mode in this phase.
- No mobile-specific optimizations beyond "does not break."
- No loop feature work — that's Phase 3. Don't let it bleed in.

## If we slip

**Fail mode to avoid:** Phase 2 drags into week 4, Phase 3 starts on a half-done foundation, landing page promise still outpaces product truth.

**Narrowing moves, in order:**
1. Drop the analytics chart restyle — current shadcn treatment is acceptable for another sprint.
2. Drop the bug detail view — list is enough.
3. Drop dark-mode planning work (already deferred).
4. Ship only `/dashboard/responses` + shell + auth in week 1-2, defer everything else to post-loop. This is the nuclear narrowing.

## Success signals

- Someone who lands on `/signup` and logs in for the first time sees a cohesive editorial surface from landing → signup → first dashboard view — no visual whiplash.
- Zero legacy shadcn colors rendered in production dashboard routes.
- Every surface has a designed empty / loading / error state.
- `prefers-reduced-motion` respected everywhere.
- Specialist review (multi-reviewer) flags no correctness blockers.

## Open questions for the user

1. **Dark mode in v1 — yes or defer?** Recommendation: defer. Editorial warmth needs its own dark treatment; doing it badly is worse than not doing it.
2. **Sidebar or top-nav?** Linear + Vercel use sidebar; Stripe Dashboard + Figma use top-nav with contextual subnavs. Recommendation: top-nav + contextual sub-nav — keeps vertical space for the editorial content, matches the landing's horizontal rhythm.
3. **Who does the Phase 3 design while I'm building Phase 2?** If you can sketch the loop UX (status column, notify preview, public roadmap page) during Phase 2, we're not starting cold when it's time to build.
4. **Is the prospect-interview thread happening in parallel?** Phase 2 is locked in regardless, but if the interviews surface "privacy isn't actually a buying trigger," the Phase 3 loop copy and the permanent landing headline might both want a revisit before Phase 4.
