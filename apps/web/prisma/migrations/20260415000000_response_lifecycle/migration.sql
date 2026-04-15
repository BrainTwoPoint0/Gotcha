-- Phase 3.1 — Response lifecycle (Canny-style loop) + notify-back fields.
--
-- Existing enum values (NEW/REVIEWED/ADDRESSED/ARCHIVED) are preserved so
-- existing rows remain valid. The five lifecycle values added below are what
-- the dashboard surfaces in the new "Lifecycle" group and what the public
-- roadmap renders.
--
-- IF NOT EXISTS guards make the enum-add idempotent so reruns are safe.
-- Postgres requires the new value to be committed before reuse — Prisma
-- migrate runs each migration file in its own transaction, so the values
-- added here are NOT referenced anywhere else in this same file.

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

-- CreateIndex: roadmap query path.
-- The roadmap renders status IN ('PLANNED','IN_PROGRESS','SHIPPED') for a
-- single project, sorted newest first. A partial index on exactly that
-- predicate is smaller than a full composite and lets the planner walk
-- index-order instead of sort-after-merge across an IN-list.
CREATE INDEX "Response_roadmap_idx"
  ON "Response"("projectId", "createdAt" DESC)
  WHERE "status" IN ('PLANNED', 'IN_PROGRESS', 'SHIPPED');

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
