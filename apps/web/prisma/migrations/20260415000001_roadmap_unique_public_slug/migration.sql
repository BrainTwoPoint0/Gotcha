-- Phase 3.2 — globally unique public-roadmap slug.
--
-- Project.slug is unique per organization, NOT globally. The public roadmap
-- route uses slug-only lookup, so without this constraint two orgs could
-- both enable a roadmap on the same slug — brand-hijack hole.
--
-- Partial unique index: enforced ONLY for projects with
-- `settings.roadmapEnabled = true`. Disabled / private projects can still
-- share slugs across orgs (existing behavior); only the public namespace
-- is globally collision-free. PATCH /api/projects/[slug]/roadmap also
-- pre-checks before flipping to give a friendlier 409 instead of a raw
-- unique-constraint error.

CREATE UNIQUE INDEX "Project_public_slug_unique"
  ON "Project"("slug")
  WHERE (settings->>'roadmapEnabled')::boolean = true;
