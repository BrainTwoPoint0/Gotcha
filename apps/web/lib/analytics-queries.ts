import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// ── Shared filter builder ─────────────────────────────────────────

function projectFilter(orgId: string, projectId?: string) {
  return Prisma.sql`"projectId" IN (
    SELECT id FROM "Project" WHERE "organizationId" = ${orgId}
    ${projectId ? Prisma.sql`AND id = ${projectId}` : Prisma.empty}
  )`;
}

function elementFilter(elementId?: string) {
  return elementId ? Prisma.sql`AND "elementIdRaw" = ${elementId}` : Prisma.empty;
}

function dateFilter(startDate: Date, endDate: Date) {
  return Prisma.sql`AND "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}`;
}

// ── Result types ──────────────────────────────────────────────────

export type DailyTrendRow = { day: string; count: bigint };
export type PollCountRow = { elementIdRaw: string; selected_option: string; count: bigint };
export type PollOptionRow = { elementIdRaw: string; option: string };
export type NpsAggRow = { promoters: bigint; passives: bigint; detractors: bigint; total: bigint };
export type HeatmapRow = { dow: number; hour: number; count: bigint };
export type SparklineRow = { element: string; day: string; avg: number };
export type TrendsRow = { day: string; avg_rating: number | null; response_count: bigint; up_count: bigint; down_count: bigint };
export type DailyNpsRow = { day: string; ratings: number[] };
export type PivotRow = { row_val: string; col_val: string; cnt: bigint };
export type TagRow = { tag: string; count: bigint };

// ── Query functions ───────────────────────────────────────────────

/** Response count per day */
export async function getDailyTrend(
  orgId: string, projectId: string | undefined, elementId: string | undefined,
  startDate: Date, endDate: Date
): Promise<DailyTrendRow[]> {
  return prisma.$queryRaw<DailyTrendRow[]>`
    SELECT DATE("createdAt") as day, COUNT(*) as count
    FROM "Response"
    WHERE ${projectFilter(orgId, projectId)}
    ${elementFilter(elementId)}
    ${dateFilter(startDate, endDate)}
    GROUP BY DATE("createdAt") ORDER BY day
  `.catch(() => []);
}

/** Poll selected option counts via jsonb unnest */
export async function getPollSelectedCounts(
  orgId: string, projectId: string | undefined, elementId: string | undefined,
  startDate: Date, endDate: Date
): Promise<PollCountRow[]> {
  return prisma.$queryRaw<PollCountRow[]>`
    SELECT "elementIdRaw", jsonb_array_elements_text("pollSelected") as selected_option, COUNT(*) as count
    FROM "Response"
    WHERE mode = 'POLL' AND "pollSelected" IS NOT NULL
    AND ${projectFilter(orgId, projectId)}
    ${elementFilter(elementId)}
    ${dateFilter(startDate, endDate)}
    GROUP BY "elementIdRaw", selected_option
  `.catch(() => []);
}

/** Distinct poll options per element (for zero-count display) */
export async function getPollAvailableOptions(
  orgId: string, projectId: string | undefined, elementId: string | undefined,
  startDate: Date, endDate: Date
): Promise<PollOptionRow[]> {
  return prisma.$queryRaw<PollOptionRow[]>`
    SELECT DISTINCT "elementIdRaw", jsonb_array_elements_text("pollOptions") as option
    FROM "Response"
    WHERE mode = 'POLL' AND "pollOptions" IS NOT NULL
    AND ${projectFilter(orgId, projectId)}
    ${elementFilter(elementId)}
    ${dateFilter(startDate, endDate)}
  `.catch(() => []);
}

/** NPS promoter/passive/detractor counts */
export async function getNpsAggregation(
  orgId: string, projectId: string | undefined, elementId: string | undefined,
  startDate: Date, endDate: Date
): Promise<NpsAggRow[]> {
  return prisma.$queryRaw<NpsAggRow[]>`
    SELECT
      COUNT(*) FILTER (WHERE rating >= 9) as promoters,
      COUNT(*) FILTER (WHERE rating >= 7 AND rating < 9) as passives,
      COUNT(*) FILTER (WHERE rating < 7) as detractors,
      COUNT(*) as total
    FROM "Response"
    WHERE mode = 'NPS' AND rating IS NOT NULL
    AND ${projectFilter(orgId, projectId)}
    ${elementFilter(elementId)}
    ${dateFilter(startDate, endDate)}
  `.catch(() => []);
}

/** Activity heatmap: day-of-week x hour */
export async function getHeatmap(
  orgId: string, projectId: string | undefined, elementId: string | undefined,
  startDate: Date, endDate: Date
): Promise<HeatmapRow[]> {
  return prisma.$queryRaw<HeatmapRow[]>`
    SELECT EXTRACT(DOW FROM "createdAt")::int as dow, EXTRACT(HOUR FROM "createdAt")::int as hour, COUNT(*) as count
    FROM "Response"
    WHERE ${projectFilter(orgId, projectId)}
    ${elementFilter(elementId)}
    ${dateFilter(startDate, endDate)}
    GROUP BY 1, 2
  `.catch(() => []);
}

/** Daily avg rating per element (top 20 by response count) */
export async function getElementSparklines(
  orgId: string, projectId: string | undefined, elementId: string | undefined,
  startDate: Date, endDate: Date
): Promise<SparklineRow[]> {
  return prisma.$queryRaw<SparklineRow[]>`
    SELECT "elementIdRaw" as element, DATE("createdAt") as day, AVG("rating") as avg
    FROM "Response"
    WHERE ${projectFilter(orgId, projectId)}
    ${elementFilter(elementId)}
    ${dateFilter(startDate, endDate)}
    AND "rating" IS NOT NULL
    AND "elementIdRaw" IN (
      SELECT "elementIdRaw" FROM "Response"
      WHERE ${projectFilter(orgId, projectId)}
      ${elementFilter(elementId)}
      ${dateFilter(startDate, endDate)}
      GROUP BY "elementIdRaw"
      ORDER BY COUNT(*) DESC
      LIMIT 20
    )
    GROUP BY 1, 2
    ORDER BY 1, 2
  `.catch(() => []);
}

/** Daily trends: avg rating, response count, vote counts */
export async function getDailyTrends(
  orgId: string, projectId: string | undefined, elementId: string | undefined,
  startDate: Date, endDate: Date
): Promise<TrendsRow[]> {
  return prisma.$queryRaw<TrendsRow[]>`
    SELECT
      DATE("createdAt") as day,
      AVG(CASE WHEN "rating" IS NOT NULL THEN "rating" END) as avg_rating,
      COUNT(*) as response_count,
      COUNT(CASE WHEN "vote" = 'UP' THEN 1 END) as up_count,
      COUNT(CASE WHEN "vote" = 'DOWN' THEN 1 END) as down_count
    FROM "Response"
    WHERE ${projectFilter(orgId, projectId)}
    ${elementFilter(elementId)}
    ${dateFilter(startDate, endDate)}
    GROUP BY DATE("createdAt")
    ORDER BY day
  `.catch(() => []);
}

/** Daily NPS ratings (for per-day NPS score calculation) */
export async function getDailyNpsRatings(
  orgId: string, projectId: string | undefined, elementId: string | undefined,
  startDate: Date, endDate: Date
): Promise<DailyNpsRow[]> {
  return prisma.$queryRaw<DailyNpsRow[]>`
    SELECT
      DATE("createdAt") as day,
      array_agg("rating") as ratings
    FROM "Response"
    WHERE ${projectFilter(orgId, projectId)}
    ${elementFilter(elementId)}
    ${dateFilter(startDate, endDate)}
    AND "mode" = 'NPS'
    AND "rating" IS NOT NULL
    GROUP BY DATE("createdAt")
    ORDER BY day
  `.catch(() => []);
}

/** Allowed DB columns for pivot queries — validated to prevent SQL injection */
const PIVOT_COLS: Record<string, string> = {
  mode: '"mode"',
  rating: '"rating"::text',
  vote: '"vote"',
  status: '"status"',
  element: '"elementIdRaw"',
};

export type PivotDimension = keyof typeof PIVOT_COLS;

/** Dynamic 2-dimension pivot (only for DB-column dimensions) */
export async function getPivotData(
  orgId: string, projectId: string | undefined, elementId: string | undefined,
  startDate: Date, endDate: Date,
  rowKey: string, colKey: string
): Promise<PivotRow[]> {
  const rowExpr = PIVOT_COLS[rowKey];
  const colExpr = PIVOT_COLS[colKey];
  if (!rowExpr || !colExpr) return [];

  return prisma.$queryRaw<PivotRow[]>`
    SELECT
      ${Prisma.raw(rowExpr)} as row_val,
      ${Prisma.raw(colExpr)} as col_val,
      COUNT(*) as cnt
    FROM "Response"
    WHERE ${projectFilter(orgId, projectId)}
    ${elementFilter(elementId)}
    ${dateFilter(startDate, endDate)}
    GROUP BY 1, 2
    ORDER BY 1, 2
  `.catch(() => []);
}

/** Available tags with counts (for filter dropdown) */
export async function getAvailableTags(orgId: string): Promise<TagRow[]> {
  return prisma.$queryRaw<TagRow[]>`
    SELECT unnest(tags) as tag, COUNT(*) as count
    FROM "Response"
    WHERE "projectId" IN (SELECT id FROM "Project" WHERE "organizationId" = ${orgId})
    GROUP BY tag ORDER BY count DESC
  `.catch(() => []);
}
