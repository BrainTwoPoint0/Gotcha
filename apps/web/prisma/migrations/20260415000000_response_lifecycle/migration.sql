-- Phase 3.1 — Response lifecycle (Canny-style loop) + notify-back fields.
--
-- Existing enum values (NEW/REVIEWED/ADDRESSED/ARCHIVED) are preserved so
-- existing rows remain valid. The five lifecycle values added below are what
-- the dashboard surfaces in the new "Lifecycle" group and what the public
-- roadmap renders.
--
-- Postgres forbids reusing a newly-added enum value inside the SAME
-- transaction that added it (error 55P04). Prisma wraps each migration
-- file in a single transaction, so anything that references these values
-- in a predicate (e.g. the partial index on status IN ('PLANNED', ...))
-- MUST live in a later migration. The roadmap partial index is in
-- 20260415500000_response_roadmap_idx for this reason.

-- AlterEnum
ALTER TYPE "ResponseStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
ALTER TYPE "ResponseStatus" ADD VALUE IF NOT EXISTS 'PLANNED';
ALTER TYPE "ResponseStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE "ResponseStatus" ADD VALUE IF NOT EXISTS 'SHIPPED';
ALTER TYPE "ResponseStatus" ADD VALUE IF NOT EXISTS 'DECLINED';

-- AlterTable: Response — lifecycle metadata + notify-back fields.
-- All nullable, so the column adds are metadata-only on PG 11+ (no row rewrite).
ALTER TABLE "Response" ADD COLUMN "statusUpdatedAt" TIMESTAMP(3);
ALTER TABLE "Response" ADD COLUMN "statusUpdatedBy" TEXT;
ALTER TABLE "Response" ADD COLUMN "shippedAt" TIMESTAMP(3);
ALTER TABLE "Response" ADD COLUMN "submitterEmail" TEXT;
ALTER TABLE "Response" ADD COLUMN "notifiedAt" TIMESTAMP(3);
ALTER TABLE "Response" ADD COLUMN "shippedNote" TEXT;

-- AlterTable: Project — per-project monthly notify-back counter (abuse cap).
ALTER TABLE "Project" ADD COLUMN "notifiesSentThisMonth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Project" ADD COLUMN "notifiesResetAt" TIMESTAMP(3);

-- CreateTable: SubmitterSuppression
-- Populated when a notify-back email recipient clicks the signed-token
-- unsubscribe link. The status PATCH route checks this before sending.
CREATE TABLE "SubmitterSuppression" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmitterSuppression_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubmitterSuppression_projectId_email_key"
  ON "SubmitterSuppression"("projectId", "email");
CREATE INDEX "SubmitterSuppression_projectId_idx"
  ON "SubmitterSuppression"("projectId");

-- AddForeignKey
ALTER TABLE "SubmitterSuppression"
  ADD CONSTRAINT "SubmitterSuppression_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
