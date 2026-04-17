import { prisma } from '@/lib/prisma';

/**
 * Atomically increment the monthly usage counter and return the new count.
 *
 * If `responsesResetAt` is null or before the start of the current month,
 * resets the counter to 1 and rolls `responsesResetAt` to now. Otherwise
 * increments by 1. Single query — no TOCTOU race condition.
 *
 * Returns the new `responsesThisMonth` value so the caller can make the
 * gating / upgrade-warning decision without a follow-up SELECT. Returns
 * null only if no Subscription row exists for the org (schema invariant
 * — shouldn't happen in prod).
 */
export async function atomicIncrementUsage(organizationId: string): Promise<number | null> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const rows = await prisma.$queryRaw<Array<{ responsesThisMonth: number }>>`
    UPDATE "Subscription"
    SET
      "responsesThisMonth" = CASE
        WHEN "responsesResetAt" IS NULL OR "responsesResetAt" < ${startOfMonth}
        THEN 1
        ELSE "responsesThisMonth" + 1
      END,
      "responsesResetAt" = CASE
        WHEN "responsesResetAt" IS NULL OR "responsesResetAt" < ${startOfMonth}
        THEN ${now}
        ELSE "responsesResetAt"
      END,
      "updatedAt" = ${now}
    WHERE "organizationId" = ${organizationId}
    RETURNING "responsesThisMonth"
  `;

  return rows[0]?.responsesThisMonth ?? null;
}
