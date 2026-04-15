-- Phase 3.1 follow-up — partial index for the public roadmap query path.
--
-- Lives in its own migration because Postgres forbids referencing newly-
-- added enum values (UNDER_REVIEW/PLANNED/IN_PROGRESS/SHIPPED/DECLINED,
-- added in 20260415000000_response_lifecycle) inside the same transaction
-- that added them (SQLSTATE 55P04). By the time this migration runs the
-- previous one has committed, so the values are safe to reference in the
-- WHERE predicate.
--
-- Partial index matches the roadmap query predicate exactly:
--   SELECT ... FROM Response
--   WHERE projectId = ? AND status IN ('PLANNED','IN_PROGRESS','SHIPPED')
--         AND createdAt > now() - interval '90 days'
--   ORDER BY createdAt DESC
-- Smaller than a full composite and lets the planner walk index-order
-- instead of sort-after-merge across the IN-list.

CREATE INDEX IF NOT EXISTS "Response_roadmap_idx"
  ON "Response"("projectId", "createdAt" DESC)
  WHERE "status" IN ('PLANNED', 'IN_PROGRESS', 'SHIPPED');
