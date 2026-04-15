import { prisma } from '@/lib/prisma';

export interface SynthesisSignal {
  /** What kind of bucket — "element" (an elementId like "checkout") or "tag" */
  kind: 'element' | 'tag';
  /** Display label — the elementId or tag string */
  label: string;
  /** Count of responses in the trailing 7-day window */
  count: number;
  /** Approximate count from the prior 7-day window for the same bucket. */
  prevCount: number;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_COUNT = 3;

/**
 * Pulls the dashboard's signature synthesis line: "X people are asking
 * about <thing> this week."
 *
 * Strategy:
 *   1. groupBy elementIdRaw over the last 7 days for the org.
 *   2. Pick the highest-volume element with at least MIN_COUNT mentions.
 *   3. Look up the same element's volume in the prior 7 days for the
 *      "up from N last week" delta line.
 *   4. Returns null when nothing meets the threshold — caller suppresses
 *      the card entirely so we never render a one-mention "synthesis."
 *
 * Deliberately element-only for v1; tags would require unnesting the
 * tags[] array which Prisma can't groupBy. Tag-based synthesis is a
 * Phase 4 follow-up.
 */
export async function getTopWeeklySignal(organizationId: string): Promise<SynthesisSignal | null> {
  const now = Date.now();
  const weekAgo = new Date(now - WEEK_MS);
  const twoWeeksAgo = new Date(now - WEEK_MS * 2);

  // Pull the org's archived element list so the synthesis card never
  // surfaces an element the admin already explicitly hid from the
  // dashboard. Empty default for new orgs.
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { archivedElementIds: true },
  });
  const archived = org?.archivedElementIds ?? [];

  // Filters mirror the dashboard's read posture:
  //   - gated: false — exclude rows the FREE plan has redacted from view
  //     (otherwise the hero card surfaces data the user can't click into).
  //   - elementIdRaw not in archived list — respect admin curation.
  //   - elementIdRaw not empty — defensive guard against any legacy rows
  //     with blank identifiers.
  const baseFilter = {
    project: { organizationId },
    gated: false,
    elementIdRaw: { not: '', notIn: archived },
  };

  const grouped = await prisma.response.groupBy({
    by: ['elementIdRaw'],
    where: {
      ...baseFilter,
      createdAt: { gte: weekAgo },
    },
    _count: { elementIdRaw: true },
    orderBy: { _count: { elementIdRaw: 'desc' } },
    take: 1,
  });

  const top = grouped[0];
  if (!top || (top._count?.elementIdRaw ?? 0) < MIN_COUNT) {
    return null;
  }

  const prevCount = await prisma.response.count({
    where: {
      ...baseFilter,
      elementIdRaw: top.elementIdRaw,
      createdAt: { gte: twoWeeksAgo, lt: weekAgo },
    },
  });

  return {
    kind: 'element',
    label: top.elementIdRaw,
    count: top._count.elementIdRaw,
    prevCount,
  };
}
