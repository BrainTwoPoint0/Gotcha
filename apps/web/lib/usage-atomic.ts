import { prisma } from '@/lib/prisma';

/**
 * Atomically increment the monthly usage counter.
 * If responsesResetAt is null or before the start of the current month,
 * resets the counter to 1 and updates responsesResetAt.
 * Otherwise, increments by 1.
 *
 * Single query — no TOCTOU race condition.
 */
export async function atomicIncrementUsage(organizationId: string): Promise<void> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  await prisma.$executeRaw`
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
  `;
}
