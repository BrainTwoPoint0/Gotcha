-- Phase 4.1 — Public roadmap upvoting.
--
-- Anonymous, cookieless upvote dedup via (responseId, voterHash) unique
-- constraint. voterHash is sha256(project.votingSalt | ip | ua-normalised)
-- — per-project salting blocks cross-project voter correlation.

-- AlterTable: Response — materialised upvote counter. Kept in sync with
-- RoadmapVote row-count inside the vote-toggle transaction so the public
-- page can read it without a COUNT(*) scan. Nullable columns on large
-- tables get metadata-only adds on PG 11+, but this column is NOT NULL
-- with a DEFAULT, which PG 11+ also handles without a row rewrite.
ALTER TABLE "Response" ADD COLUMN "upvoteCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: Project — per-project voting salt. Nullable, lazy-generated
-- on first vote by the API route. Existing projects get NULL and pick up
-- a cuid() on their first observed vote.
ALTER TABLE "Project" ADD COLUMN "votingSalt" TEXT;

-- CreateTable: RoadmapVote
CREATE TABLE "RoadmapVote" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "voterHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoadmapVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique dedup primitive + the toggle-off authz primitive.
-- Same hash returning means "it's me again, remove my vote." The composite's
-- leading column serves any responseId-only lookup (FK cascade,
-- count-by-response), so no standalone ("responseId") index is needed.
CREATE UNIQUE INDEX "RoadmapVote_responseId_voterHash_key"
  ON "RoadmapVote"("responseId", "voterHash");

-- AddForeignKey
ALTER TABLE "RoadmapVote"
  ADD CONSTRAINT "RoadmapVote_responseId_fkey"
  FOREIGN KEY ("responseId") REFERENCES "Response"("id") ON DELETE CASCADE ON UPDATE CASCADE;
