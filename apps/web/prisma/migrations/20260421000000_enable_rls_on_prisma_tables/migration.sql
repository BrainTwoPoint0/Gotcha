-- Enable RLS on the three Prisma-created tables that were missing it.
--
-- The Supabase `public` schema is auto-exposed via PostgREST using the
-- anon key that ships in the client bundle. Every other table in the
-- schema already has RLS enabled with zero policies, which locks the
-- REST surface to anonymous/authenticated callers while leaving Prisma
-- (connecting directly on DATABASE_URL) unaffected — RLS is bypassed
-- by direct Postgres connections. These three tables were added in
-- later migrations that forgot the toggle, and Supabase's security
-- advisor flagged them as publicly accessible.
--
-- No policies are added. The lockdown pattern is "RLS on, no grants" —
-- all reads/writes go through Prisma server-side.

ALTER TABLE "SubmitterSuppression"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RoadmapVote"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProcessedStripeEvent"  ENABLE ROW LEVEL SECURITY;
