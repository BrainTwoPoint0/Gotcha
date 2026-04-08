import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getAuthUser, getActiveOrganization } from '@/lib/auth';
import Link from 'next/link';
import { AnalyticsCharts } from './charts';
import { AnalyticsFilter } from './analytics-filter';
import { ElementsTab } from './elements-tab';
import { TrendsTab } from './trends-tab';
import { PivotTab } from './pivot-tab';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';
import { calculateNPS } from '@/lib/nps';
import { parseDevice, parseBrowser } from '@/lib/ua-parser';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    projectId?: string;
    elementId?: string;
    tab?: string;
    pivotRow?: string;
    pivotCol?: string;
  }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getAuthUser();

  const dbUser = user
    ? await prisma.user.findUnique({
        where: { email: user.email! },
      })
    : null;

  const activeOrg = user?.email ? await getActiveOrganization(user.email) : null;
  const organization = activeOrg?.organization;
  const isPro = activeOrg?.isPro ?? false;

  // Pro gate - show upgrade prompt for FREE users or if no organization
  if (!isPro || !organization) {
    return (
      <div>
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <DashboardFeedback
              elementId="analytics-priorities-free"
              mode="poll"
              promptText="What analytics matter most to you?"
              options={[
                'Sentiment trends',
                'Response heatmaps',
                'NPS tracking',
                'Export / download reports',
                'Comparison reports',
              ]}
              userEmail={dbUser?.email}
              userName={dbUser?.name ?? undefined}
              userProfile={{
                companySize: dbUser?.companySize ?? undefined,
                role: dbUser?.role ?? undefined,
                industry: dbUser?.industry ?? undefined,
                useCase: dbUser?.useCase ?? undefined,
                plan: 'FREE',
              }}
            />
          </div>
          <p className="text-gray-600">Insights into your feedback data</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unlock Analytics</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Upgrade to Pro to access detailed analytics including response trends, sentiment
            analysis, and rating insights.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-slate-700 hover:bg-slate-800"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  // ── Resolve active tab ──────────────────────────────────────────
  const activeTab = params.tab || 'overview';

  // Fetch projects and elements for filter dropdowns in parallel
  const [projects, elementsData] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: organization.id },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    prisma.response.groupBy({
      by: ['elementIdRaw'],
      where: {
        project: {
          organizationId: organization.id,
          ...(params.projectId && { id: params.projectId }),
        },
      },
      _count: {
        elementIdRaw: true,
      },
      orderBy: {
        _count: {
          elementIdRaw: 'desc',
        },
      },
    }),
  ]);

  const archivedElementIds = organization.archivedElementIds ?? [];

  const elements = elementsData
    .filter((e) => !archivedElementIds.includes(e.elementIdRaw))
    .map((e) => ({
      elementIdRaw: e.elementIdRaw,
      count: e._count.elementIdRaw,
    }));

  // Parse date filters (default to last 30 days if no filters)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const startDate = params.startDate ? new Date(params.startDate) : thirtyDaysAgo;
  const endDate = params.endDate ? new Date(`${params.endDate}T23:59:59.999Z`) : new Date();
  const projectId = params.projectId || undefined;
  const elementId = params.elementId || undefined;

  // Build where clause
  const where = {
    project: {
      organizationId: organization.id,
      ...(projectId && { id: projectId }),
    },
    ...(elementId && { elementIdRaw: elementId }),
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  // Calculate date range for display
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const dateRangeLabel =
    params.startDate || params.endDate
      ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
      : 'Last 30 days';
  const selectedProject = projectId ? projects.find((p) => p.id === projectId) : null;
  const selectedElement = elementId || null;

  // ── Tab-specific data fetching ──────────────────────────────────

  // Overview tab data
  let overviewData = null;
  if (activeTab === 'overview') {
    // ── Comparison period ──────────────────────────────────────────
    const periodMs = endDate.getTime() - startDate.getTime();
    const prevEnd = new Date(startDate.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - periodMs);

    const prevWhere = {
      project: {
        organizationId: organization.id,
        ...(projectId && { id: projectId }),
      },
      ...(elementId && { elementIdRaw: elementId }),
      createdAt: { gte: prevStart, lte: prevEnd },
    };

    const [
      modeCountsRaw,
      ratingAgg,
      voteCountsRaw,
      dailyTrendRaw,
      elementPerfRaw,
      pollResponses,
      npsAggRaw,
      ratingDistRaw,
      heatmapRaw,
      prevCount,
      prevRatingAgg,
      prevVoteCountsRaw,
    ] = await Promise.all([
      prisma.response.groupBy({
        by: ['mode'],
        where,
        _count: { mode: true },
      }),
      prisma.response.aggregate({
        where: { ...where, rating: { not: null } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.response.groupBy({
        by: ['vote'],
        where: { ...where, vote: { not: null } },
        _count: { vote: true },
      }),
      prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
        SELECT DATE("createdAt") as day, COUNT(*) as count
        FROM "Response"
        WHERE "projectId" IN (
          SELECT id FROM "Project" WHERE "organizationId" = ${organization.id}
          ${projectId ? Prisma.sql`AND id = ${projectId}` : Prisma.empty}
        )
        ${elementId ? Prisma.sql`AND "elementIdRaw" = ${elementId}` : Prisma.empty}
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
        GROUP BY DATE("createdAt")
        ORDER BY day
      `.catch(() => [] as Array<{ day: string; count: bigint }>),
      prisma.response.groupBy({
        by: ['elementIdRaw'],
        where,
        _count: { elementIdRaw: true },
        _avg: { rating: true },
        orderBy: { _count: { elementIdRaw: 'desc' } },
        take: 10,
      }),
      prisma.response.findMany({
        where: { ...where, mode: 'POLL' },
        take: 10000,
        select: {
          elementIdRaw: true,
          pollOptions: true,
          pollSelected: true,
        },
      }),
      // NPS: count promoters/passives/detractors in SQL instead of fetching 10K rows
      prisma.$queryRaw<Array<{ promoters: bigint; passives: bigint; detractors: bigint; total: bigint }>>`
        SELECT
          COUNT(*) FILTER (WHERE rating >= 9) as promoters,
          COUNT(*) FILTER (WHERE rating >= 7 AND rating < 9) as passives,
          COUNT(*) FILTER (WHERE rating < 7) as detractors,
          COUNT(*) as total
        FROM "Response"
        WHERE mode = 'NPS' AND rating IS NOT NULL
        AND "projectId" IN (
          SELECT id FROM "Project" WHERE "organizationId" = ${organization.id}
          ${projectId ? Prisma.sql`AND id = ${projectId}` : Prisma.empty}
        )
        ${elementId ? Prisma.sql`AND "elementIdRaw" = ${elementId}` : Prisma.empty}
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      `.catch(() => [] as Array<{ promoters: bigint; passives: bigint; detractors: bigint; total: bigint }>),
      // Rating distribution (1–5)
      prisma.response.groupBy({
        by: ['rating'],
        where: { ...where, mode: 'FEEDBACK', rating: { not: null } },
        _count: { rating: true },
      }),
      // Heatmap: day-of-week x hour
      prisma.$queryRaw<Array<{ dow: number; hour: number; count: bigint }>>`
        SELECT EXTRACT(DOW FROM "createdAt")::int as dow,
               EXTRACT(HOUR FROM "createdAt")::int as hour,
               COUNT(*) as count
        FROM "Response"
        WHERE "projectId" IN (
          SELECT id FROM "Project" WHERE "organizationId" = ${organization.id}
          ${projectId ? Prisma.sql`AND id = ${projectId}` : Prisma.empty}
        )
        ${elementId ? Prisma.sql`AND "elementIdRaw" = ${elementId}` : Prisma.empty}
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
        GROUP BY 1, 2
      `.catch(() => [] as Array<{ dow: number; hour: number; count: bigint }>),
      // Previous period: total count
      prisma.response.count({ where: prevWhere }),
      // Previous period: avg rating
      prisma.response.aggregate({
        where: { ...prevWhere, rating: { not: null } },
        _avg: { rating: true },
      }),
      // Previous period: vote counts
      prisma.response.groupBy({
        by: ['vote'],
        where: { ...prevWhere, vote: { not: null } },
        _count: { vote: true },
      }),
    ]);

    const totalResponses = modeCountsRaw.reduce((sum, m) => sum + m._count.mode, 0);

    const modeData = modeCountsRaw.map((m) => ({
      name: m.mode.toLowerCase().replace('_', ' '),
      value: m._count.mode,
    }));

    const voteCounts = { UP: 0, DOWN: 0 };
    voteCountsRaw.forEach((v) => {
      if (v.vote === 'UP') voteCounts.UP = v._count.vote;
      if (v.vote === 'DOWN') voteCounts.DOWN = v._count.vote;
    });

    const sentimentData = [
      { name: 'Positive', value: voteCounts.UP, color: '#22c55e' },
      { name: 'Negative', value: voteCounts.DOWN, color: '#ef4444' },
    ].filter((d) => d.value > 0);

    const avgRating = ratingAgg._avg.rating ? ratingAgg._avg.rating.toFixed(1) : null;

    const positiveRate =
      voteCounts.UP + voteCounts.DOWN > 0
        ? Math.round((voteCounts.UP / (voteCounts.UP + voteCounts.DOWN)) * 100)
        : null;

    // Format daily trend
    const dailyCounts: Record<string, number> = {};
    const daysToShow = Math.min(daysDiff, 90);
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyCounts[key] = 0;
    }
    dailyTrendRaw.forEach((row) => {
      const key =
        typeof row.day === 'string'
          ? row.day.split('T')[0]
          : new Date(row.day).toISOString().split('T')[0];
      if (dailyCounts[key] !== undefined) {
        dailyCounts[key] = Number(row.count);
      }
    });

    const trendData = Object.entries(dailyCounts).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      responses: count,
    }));

    // Poll aggregation
    const pollMap: Record<string, { elementId: string; optionCounts: Record<string, number> }> = {};
    pollResponses.forEach((r) => {
      if (!Array.isArray(r.pollSelected) || r.pollSelected.length === 0) return;
      if (!pollMap[r.elementIdRaw]) {
        const allOptions = Array.isArray(r.pollOptions) ? (r.pollOptions as string[]) : [];
        const optionCounts: Record<string, number> = {};
        allOptions.forEach((opt) => (optionCounts[opt] = 0));
        pollMap[r.elementIdRaw] = { elementId: r.elementIdRaw, optionCounts };
      }
      (r.pollSelected as string[]).forEach((sel) => {
        pollMap[r.elementIdRaw].optionCounts[sel] =
          (pollMap[r.elementIdRaw].optionCounts[sel] || 0) + 1;
      });
    });
    const pollData = Object.values(pollMap).map((p) => ({
      elementId: p.elementId,
      options: Object.entries(p.optionCounts).map(([name, count]) => ({ name, count })),
    }));

    // Element performance — get vote breakdown per element for top 10
    const topElementIds = elementPerfRaw.map((e) => e.elementIdRaw);
    const elementVotes =
      topElementIds.length > 0
        ? await prisma.response.groupBy({
            by: ['elementIdRaw', 'vote'],
            where: { ...where, elementIdRaw: { in: topElementIds }, vote: { not: null } },
            _count: { vote: true },
          })
        : [];

    const elementVoteMap: Record<string, { up: number; down: number }> = {};
    elementVotes.forEach((v) => {
      if (!elementVoteMap[v.elementIdRaw]) elementVoteMap[v.elementIdRaw] = { up: 0, down: 0 };
      if (v.vote === 'UP') elementVoteMap[v.elementIdRaw].up = v._count.vote;
      if (v.vote === 'DOWN') elementVoteMap[v.elementIdRaw].down = v._count.vote;
    });

    // Build NPS result from SQL aggregation
    const npsRow = npsAggRaw[0];
    const npsResult = npsRow && Number(npsRow.total) > 0
      ? (() => {
          const promoters = Number(npsRow.promoters);
          const passives = Number(npsRow.passives);
          const detractors = Number(npsRow.detractors);
          const total = Number(npsRow.total);
          const promoterPct = Math.round((promoters / total) * 100);
          const passivePct = Math.round((passives / total) * 100);
          const detractorPct = Math.round((detractors / total) * 100);
          return {
            score: promoterPct - detractorPct,
            promoters,
            passives,
            detractors,
            promoterPct,
            passivePct,
            detractorPct,
            total,
          };
        })()
      : null;

    // Rating distribution — fill in all 1–5 values
    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => {
      const found = ratingDistRaw.find((r) => r.rating === rating);
      return { rating, count: found ? found._count.rating : 0 };
    });

    // Heatmap — convert DOW (Postgres: 0=Sun) to Mon-first (0=Mon)
    const heatmapData = heatmapRaw.map((row) => ({
      dow: row.dow === 0 ? 6 : row.dow - 1, // Sun(0)->6, Mon(1)->0, etc.
      hour: row.hour,
      count: Number(row.count),
    }));

    // Comparison deltas
    const prevVoteCounts = { UP: 0, DOWN: 0 };
    prevVoteCountsRaw.forEach((v) => {
      if (v.vote === 'UP') prevVoteCounts.UP = v._count.vote;
      if (v.vote === 'DOWN') prevVoteCounts.DOWN = v._count.vote;
    });
    const prevPositiveRate =
      prevVoteCounts.UP + prevVoteCounts.DOWN > 0
        ? Math.round((prevVoteCounts.UP / (prevVoteCounts.UP + prevVoteCounts.DOWN)) * 100)
        : null;
    const prevAvgRating = prevRatingAgg._avg.rating
      ? Number(prevRatingAgg._avg.rating.toFixed(1))
      : null;

    const deltas = {
      totalResponses:
        prevCount > 0 ? Math.round(((totalResponses - prevCount) / prevCount) * 100) : null,
      avgRating:
        avgRating !== null && prevAvgRating !== null
          ? Number((parseFloat(avgRating) - prevAvgRating).toFixed(1))
          : null,
      positiveRate:
        positiveRate !== null && prevPositiveRate !== null ? positiveRate - prevPositiveRate : null,
    };

    const elementPerformance = elementPerfRaw.map((e) => {
      const votes = elementVoteMap[e.elementIdRaw] || { up: 0, down: 0 };
      const totalVotes = votes.up + votes.down;
      return {
        elementId: e.elementIdRaw,
        total: e._count.elementIdRaw,
        avgRating: e._avg.rating ? Number(e._avg.rating.toFixed(1)) : null,
        positiveRate: totalVotes > 0 ? Math.round((votes.up / totalVotes) * 100) : null,
      };
    });

    overviewData = {
      totalResponses,
      avgRating,
      positiveRate,
      modeData,
      sentimentData,
      trendData,
      pollData,
      elementPerformance,
      npsResult,
      ratingDistribution,
      heatmapData,
      deltas,
    };
  }

  // Elements tab data
  let elementsTabData = null;
  if (activeTab === 'elements') {
    // Get ALL elements (not just top 10) with counts + ratings
    const [allElementsRaw, allElementVotesRaw, sparklineRaw] = await Promise.all([
      prisma.response.groupBy({
        by: ['elementIdRaw'],
        where,
        _count: { elementIdRaw: true },
        _avg: { rating: true },
        orderBy: { _count: { elementIdRaw: 'desc' } },
      }),
      prisma.response.groupBy({
        by: ['elementIdRaw', 'vote'],
        where: { ...where, vote: { not: null } },
        _count: { vote: true },
      }),
      // Sparkline: daily avg rating per element (top 20)
      prisma.$queryRaw<Array<{ element: string; day: string; avg: number }>>`
          SELECT "elementIdRaw" as element, DATE("createdAt") as day, AVG("rating") as avg
          FROM "Response"
          WHERE "projectId" IN (
            SELECT id FROM "Project" WHERE "organizationId" = ${organization.id}
            ${projectId ? Prisma.sql`AND id = ${projectId}` : Prisma.empty}
          )
          ${elementId ? Prisma.sql`AND "elementIdRaw" = ${elementId}` : Prisma.empty}
          AND "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
          AND "rating" IS NOT NULL
          AND "elementIdRaw" IN (
            SELECT "elementIdRaw" FROM "Response"
            WHERE "projectId" IN (
              SELECT id FROM "Project" WHERE "organizationId" = ${organization.id}
              ${projectId ? Prisma.sql`AND id = ${projectId}` : Prisma.empty}
            )
            ${elementId ? Prisma.sql`AND "elementIdRaw" = ${elementId}` : Prisma.empty}
            AND "createdAt" >= ${startDate}
            AND "createdAt" <= ${endDate}
            GROUP BY "elementIdRaw"
            ORDER BY COUNT(*) DESC
            LIMIT 20
          )
          GROUP BY 1, 2
          ORDER BY 1, 2
        `.catch(() => [] as Array<{ element: string; day: string; avg: number }>),
    ]);

    // Overall averages (exclude archived elements so benchmarks reflect visible data only)
    const activeElementsRaw = allElementsRaw.filter(
      (e) => !archivedElementIds.includes(e.elementIdRaw)
    );
    const activeVotesRaw = allElementVotesRaw.filter(
      (v) => !archivedElementIds.includes(v.elementIdRaw)
    );

    // Compute overall avg rating from active elements only
    let totalRatingSum = 0;
    let totalRatingCount = 0;
    activeElementsRaw.forEach((e) => {
      if (e._avg.rating !== null) {
        totalRatingSum += e._avg.rating * e._count.elementIdRaw;
        totalRatingCount += e._count.elementIdRaw;
      }
    });
    const overallAvgRating =
      totalRatingCount > 0 ? Number((totalRatingSum / totalRatingCount).toFixed(1)) : null;

    let overallUp = 0,
      overallDown = 0;
    activeVotesRaw.forEach((v) => {
      if (v.vote === 'UP') overallUp += v._count.vote;
      if (v.vote === 'DOWN') overallDown += v._count.vote;
    });
    const overallPositiveRate =
      overallUp + overallDown > 0
        ? Math.round((overallUp / (overallUp + overallDown)) * 100)
        : null;

    // Per-element vote map
    const elVoteMap: Record<string, { up: number; down: number }> = {};
    allElementVotesRaw.forEach((v) => {
      if (!elVoteMap[v.elementIdRaw]) elVoteMap[v.elementIdRaw] = { up: 0, down: 0 };
      if (v.vote === 'UP') elVoteMap[v.elementIdRaw].up = v._count.vote;
      if (v.vote === 'DOWN') elVoteMap[v.elementIdRaw].down = v._count.vote;
    });

    // Benchmarks include ALL elements (active + archived) intentionally —
    // ElementsTab partitions them client-side to render the archived section.
    const benchmarks = allElementsRaw.map((e) => {
      const votes = elVoteMap[e.elementIdRaw] || { up: 0, down: 0 };
      const totalVotes = votes.up + votes.down;
      const avgRating = e._avg.rating ? Number(e._avg.rating.toFixed(1)) : null;
      const positiveRate = totalVotes > 0 ? Math.round((votes.up / totalVotes) * 100) : null;

      return {
        elementId: e.elementIdRaw,
        total: e._count.elementIdRaw,
        avgRating,
        positiveRate,
        ratingDelta:
          avgRating !== null && overallAvgRating !== null
            ? Number((avgRating - overallAvgRating).toFixed(1))
            : null,
        positiveDelta:
          positiveRate !== null && overallPositiveRate !== null
            ? positiveRate - overallPositiveRate
            : null,
      };
    });

    // ── Anomaly detection ──────────────────────────────────────────
    // Compare last 7 days vs prior 30-day baseline per element
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtySevenDaysAgo = new Date(now);
    thirtySevenDaysAgo.setDate(thirtySevenDaysAgo.getDate() - 37);

    const baseWhere = {
      project: {
        organizationId: organization.id,
        ...(projectId && { id: projectId }),
      },
    };

    const [recentByElement, baselineByElement, recentVotesByElement, baselineVotesByElement] =
      await Promise.all([
        // Last 7 days per element
        prisma.response.groupBy({
          by: ['elementIdRaw'],
          where: { ...baseWhere, createdAt: { gte: sevenDaysAgo, lte: now } },
          _count: { elementIdRaw: true },
          _avg: { rating: true },
        }),
        // Prior 30 days per element (day -37 to day -7)
        prisma.response.groupBy({
          by: ['elementIdRaw'],
          where: { ...baseWhere, createdAt: { gte: thirtySevenDaysAgo, lt: sevenDaysAgo } },
          _count: { elementIdRaw: true },
          _avg: { rating: true },
        }),
        // Recent votes
        prisma.response.groupBy({
          by: ['elementIdRaw', 'vote'],
          where: { ...baseWhere, createdAt: { gte: sevenDaysAgo, lte: now }, vote: { not: null } },
          _count: { vote: true },
        }),
        // Baseline votes
        prisma.response.groupBy({
          by: ['elementIdRaw', 'vote'],
          where: {
            ...baseWhere,
            createdAt: { gte: thirtySevenDaysAgo, lt: sevenDaysAgo },
            vote: { not: null },
          },
          _count: { vote: true },
        }),
      ]);

    // Build maps
    const recentMap: Record<string, { count: number; avgRating: number | null }> = {};
    recentByElement.forEach((r) => {
      recentMap[r.elementIdRaw] = {
        count: r._count.elementIdRaw,
        avgRating: r._avg.rating ? Number(r._avg.rating.toFixed(1)) : null,
      };
    });

    const baselineMap: Record<string, { count: number; avgRating: number | null }> = {};
    baselineByElement.forEach((r) => {
      baselineMap[r.elementIdRaw] = {
        count: r._count.elementIdRaw,
        avgRating: r._avg.rating ? Number(r._avg.rating.toFixed(1)) : null,
      };
    });

    // Vote maps
    const recentVoteMap: Record<string, { up: number; down: number }> = {};
    recentVotesByElement.forEach((v) => {
      if (!recentVoteMap[v.elementIdRaw]) recentVoteMap[v.elementIdRaw] = { up: 0, down: 0 };
      if (v.vote === 'UP') recentVoteMap[v.elementIdRaw].up = v._count.vote;
      if (v.vote === 'DOWN') recentVoteMap[v.elementIdRaw].down = v._count.vote;
    });

    const baselineVoteMap: Record<string, { up: number; down: number }> = {};
    baselineVotesByElement.forEach((v) => {
      if (!baselineVoteMap[v.elementIdRaw]) baselineVoteMap[v.elementIdRaw] = { up: 0, down: 0 };
      if (v.vote === 'UP') baselineVoteMap[v.elementIdRaw].up = v._count.vote;
      if (v.vote === 'DOWN') baselineVoteMap[v.elementIdRaw].down = v._count.vote;
    });

    type Anomaly = {
      elementId: string;
      type: 'volume_spike' | 'volume_drop' | 'rating_drop' | 'sentiment_drop';
      description: string;
      severity: 'info' | 'warning' | 'critical';
      currentValue: number;
      baselineValue: number;
    };

    const anomalies: Anomaly[] = [];

    // Check each element that has baseline data (exclude archived)
    const allElementIds = Array.from(
      new Set([...Object.keys(recentMap), ...Object.keys(baselineMap)])
    ).filter((id) => !archivedElementIds.includes(id));

    for (const elId of allElementIds) {
      const recent = recentMap[elId];
      const baseline = baselineMap[elId];

      if (!baseline || baseline.count < 10) continue; // Not enough baseline

      const baselineDailyAvg = baseline.count / 30;
      const recentDailyAvg = (recent?.count || 0) / 7;

      // Volume spike
      if (recentDailyAvg > baselineDailyAvg * 5) {
        anomalies.push({
          elementId: elId,
          type: 'volume_spike',
          description: `Feedback volume spiked ${Math.round((recentDailyAvg / baselineDailyAvg) * 100)}% (${baselineDailyAvg.toFixed(1)}/day → ${recentDailyAvg.toFixed(1)}/day)`,
          severity: 'critical',
          currentValue: recentDailyAvg,
          baselineValue: baselineDailyAvg,
        });
      } else if (recentDailyAvg > baselineDailyAvg * 2) {
        anomalies.push({
          elementId: elId,
          type: 'volume_spike',
          description: `Feedback volume up ${Math.round((recentDailyAvg / baselineDailyAvg) * 100)}% (${baselineDailyAvg.toFixed(1)}/day → ${recentDailyAvg.toFixed(1)}/day)`,
          severity: 'warning',
          currentValue: recentDailyAvg,
          baselineValue: baselineDailyAvg,
        });
      }

      // Volume drop
      if (recent && recentDailyAvg < baselineDailyAvg * 0.3) {
        anomalies.push({
          elementId: elId,
          type: 'volume_drop',
          description: `Feedback volume dropped to ${Math.round((recentDailyAvg / baselineDailyAvg) * 100)}% of baseline`,
          severity: 'info',
          currentValue: recentDailyAvg,
          baselineValue: baselineDailyAvg,
        });
      }

      // Rating drop
      if (
        recent?.avgRating !== null &&
        baseline.avgRating !== null &&
        recent?.avgRating !== undefined &&
        baseline.avgRating !== undefined
      ) {
        const ratingDrop = baseline.avgRating - recent.avgRating;
        if (ratingDrop > 1.0) {
          anomalies.push({
            elementId: elId,
            type: 'rating_drop',
            description: `Rating dropped from ${baseline.avgRating} to ${recent.avgRating} (-${ratingDrop.toFixed(1)})`,
            severity: 'critical',
            currentValue: recent.avgRating,
            baselineValue: baseline.avgRating,
          });
        } else if (ratingDrop > 0.5) {
          anomalies.push({
            elementId: elId,
            type: 'rating_drop',
            description: `Rating dropped from ${baseline.avgRating} to ${recent.avgRating} (-${ratingDrop.toFixed(1)})`,
            severity: 'warning',
            currentValue: recent.avgRating,
            baselineValue: baseline.avgRating,
          });
        }
      }

      // Sentiment shift
      const recentVotes = recentVoteMap[elId] || { up: 0, down: 0 };
      const baselineVotes = baselineVoteMap[elId] || { up: 0, down: 0 };
      const recentTotal = recentVotes.up + recentVotes.down;
      const baselineTotal = baselineVotes.up + baselineVotes.down;

      if (recentTotal >= 5 && baselineTotal >= 5) {
        const recentPositive = Math.round((recentVotes.up / recentTotal) * 100);
        const baselinePositive = Math.round((baselineVotes.up / baselineTotal) * 100);
        const drop = baselinePositive - recentPositive;

        if (drop > 15) {
          anomalies.push({
            elementId: elId,
            type: 'sentiment_drop',
            description: `Positive rate dropped from ${baselinePositive}% to ${recentPositive}% (-${drop}pp)`,
            severity: drop > 30 ? 'critical' : 'warning',
            currentValue: recentPositive,
            baselineValue: baselinePositive,
          });
        }
      }
    }

    // Sort: critical first, then warning, then info
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Build sparkline map
    const sparklineData: Record<string, Array<{ day: string; avg: number }>> = {};
    sparklineRaw.forEach((row) => {
      const key =
        typeof row.day === 'string'
          ? row.day.split('T')[0]
          : new Date(row.day).toISOString().split('T')[0];
      if (!sparklineData[row.element]) sparklineData[row.element] = [];
      sparklineData[row.element].push({ day: key, avg: Number(Number(row.avg).toFixed(1)) });
    });

    elementsTabData = {
      benchmarks,
      anomalies,
      overallAvgRating,
      overallPositiveRate,
      sparklineData,
    };
  }

  // Trends tab data
  let trendsTabData = null;
  if (activeTab === 'trends') {
    const trendsRaw = await prisma.$queryRaw<
      Array<{
        day: string;
        avg_rating: number | null;
        response_count: bigint;
        up_count: bigint;
        down_count: bigint;
      }>
    >`
      SELECT
        DATE("createdAt") as day,
        AVG(CASE WHEN "rating" IS NOT NULL THEN "rating" END) as avg_rating,
        COUNT(*) as response_count,
        COUNT(CASE WHEN "vote" = 'UP' THEN 1 END) as up_count,
        COUNT(CASE WHEN "vote" = 'DOWN' THEN 1 END) as down_count
      FROM "Response"
      WHERE "projectId" IN (
        SELECT id FROM "Project" WHERE "organizationId" = ${organization.id}
        ${projectId ? Prisma.sql`AND id = ${projectId}` : Prisma.empty}
      )
      ${elementId ? Prisma.sql`AND "elementIdRaw" = ${elementId}` : Prisma.empty}
      AND "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
      GROUP BY DATE("createdAt")
      ORDER BY day
    `.catch(() => []);

    // NPS per day (separate query since NPS calc is special)
    const npsRaw = await prisma.$queryRaw<Array<{ day: string; ratings: number[] }>>`
      SELECT
        DATE("createdAt") as day,
        array_agg("rating") as ratings
      FROM "Response"
      WHERE "projectId" IN (
        SELECT id FROM "Project" WHERE "organizationId" = ${organization.id}
        ${projectId ? Prisma.sql`AND id = ${projectId}` : Prisma.empty}
      )
      ${elementId ? Prisma.sql`AND "elementIdRaw" = ${elementId}` : Prisma.empty}
      AND "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
      AND "mode" = 'NPS'
      AND "rating" IS NOT NULL
      GROUP BY DATE("createdAt")
      ORDER BY day
    `.catch(() => []);

    const npsMap: Record<string, number> = {};
    npsRaw.forEach((row) => {
      const key =
        typeof row.day === 'string'
          ? row.day.split('T')[0]
          : new Date(row.day).toISOString().split('T')[0];
      const result = calculateNPS(row.ratings);
      if (result) npsMap[key] = result.score;
    });

    trendsTabData = trendsRaw.map((row) => {
      const key =
        typeof row.day === 'string'
          ? row.day.split('T')[0]
          : new Date(row.day).toISOString().split('T')[0];

      const upCount = Number(row.up_count);
      const downCount = Number(row.down_count);
      const totalVotes = upCount + downCount;

      return {
        date: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avgRating: row.avg_rating ? Number(Number(row.avg_rating).toFixed(1)) : null,
        positiveRate: totalVotes > 0 ? Math.round((upCount / totalVotes) * 100) : null,
        npsScore: npsMap[key] ?? null,
        responseCount: Number(row.response_count),
      };
    });
  }

  // ── Pivot tab data ─────────────────────────────────────────────
  // Available pivot dimensions
  const PIVOT_DIMENSIONS = [
    { key: 'mode', label: 'Mode' },
    { key: 'rating', label: 'Rating' },
    { key: 'vote', label: 'Vote' },
    { key: 'status', label: 'Status' },
    { key: 'element', label: 'Element' },
    { key: 'url', label: 'Page URL' },
    { key: 'device', label: 'Device' },
    { key: 'browser', label: 'Browser' },
  ];

  let pivotData: {
    rows: string[];
    cols: string[];
    cells: Record<string, Record<string, number>>;
  } | null = null;

  // Discover metadata fields for pivot dimensions
  let pivotMetaFields: { key: string; label: string }[] = [];
  if (activeTab === 'pivot') {
    const sampleMeta = await prisma.response.findMany({
      where: {
        project: { organizationId: organization.id, ...(projectId && { id: projectId }) },
        NOT: { endUserMeta: { equals: {} } },
      },
      select: { endUserMeta: true },
      take: 100,
    });
    const fieldSet = new Set<string>();
    sampleMeta.forEach((r) => {
      const meta = r.endUserMeta as Record<string, unknown>;
      if (meta && typeof meta === 'object') {
        Object.keys(meta).forEach((k) => {
          if (k !== 'id') fieldSet.add(k);
        });
      }
    });
    pivotMetaFields = Array.from(fieldSet).map((k) => ({ key: `meta:${k}`, label: k }));
  }

  const allPivotDimensions = [...PIVOT_DIMENSIONS, ...pivotMetaFields];

  const pivotRow = params.pivotRow || '';
  const pivotCol = params.pivotCol || '';

  if (activeTab === 'pivot' && pivotRow && pivotCol) {
    // DB-native columns we can GROUP BY directly
    const DB_COLS: Record<string, string> = {
      mode: '"mode"',
      rating: '"rating"::text',
      vote: '"vote"',
      status: '"status"',
      element: '"elementIdRaw"',
    };

    const rowIsDb = pivotRow in DB_COLS;
    const colIsDb = pivotCol in DB_COLS;

    if (rowIsDb && colIsDb) {
      // Pure SQL pivot
      const rawRows = await prisma.$queryRaw<
        Array<{ row_val: string; col_val: string; cnt: bigint }>
      >`
        SELECT
          ${Prisma.raw(DB_COLS[pivotRow])} as row_val,
          ${Prisma.raw(DB_COLS[pivotCol])} as col_val,
          COUNT(*) as cnt
        FROM "Response"
        WHERE "projectId" IN (
          SELECT id FROM "Project" WHERE "organizationId" = ${organization.id}
          ${projectId ? Prisma.sql`AND id = ${projectId}` : Prisma.empty}
        )
        ${elementId ? Prisma.sql`AND "elementIdRaw" = ${elementId}` : Prisma.empty}
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
        GROUP BY 1, 2
        ORDER BY 1, 2
      `.catch(() => []);

      const cells: Record<string, Record<string, number>> = {};
      const rowSet = new Set<string>();
      const colSet = new Set<string>();
      rawRows.forEach((r) => {
        const rv = r.row_val ?? '(empty)';
        const cv = r.col_val ?? '(empty)';
        rowSet.add(rv);
        colSet.add(cv);
        if (!cells[rv]) cells[rv] = {};
        cells[rv][cv] = Number(r.cnt);
      });
      pivotData = { rows: Array.from(rowSet), cols: Array.from(colSet), cells };
    } else {
      // Need to fetch responses + derive in JS
      const responses = await prisma.response.findMany({
        where,
        select: {
          mode: true,
          rating: true,
          vote: true,
          status: true,
          elementIdRaw: true,
          url: true,
          userAgent: true,
          endUserMeta: true,
        },
        take: 10000,
      });

      const extractVal = (r: (typeof responses)[0], dim: string): string => {
        if (dim === 'mode') return r.mode;
        if (dim === 'rating') return r.rating !== null ? String(r.rating) : '(empty)';
        if (dim === 'vote') return r.vote ?? '(empty)';
        if (dim === 'status') return r.status;
        if (dim === 'element') return r.elementIdRaw;
        if (dim === 'url') {
          try {
            return new URL(r.url || '').pathname;
          } catch {
            return r.url || '(empty)';
          }
        }
        if (dim === 'device') return parseDevice(r.userAgent);
        if (dim === 'browser') return parseBrowser(r.userAgent);
        if (dim.startsWith('meta:')) {
          const key = dim.slice(5);
          const meta = r.endUserMeta as Record<string, unknown>;
          const val = meta?.[key];
          return val !== undefined && val !== null ? String(val) : '(not set)';
        }
        return '(unknown)';
      };

      const cells: Record<string, Record<string, number>> = {};
      const rowSet = new Set<string>();
      const colSet = new Set<string>();

      responses.forEach((r) => {
        const rv = extractVal(r, pivotRow);
        const cv = extractVal(r, pivotCol);
        rowSet.add(rv);
        colSet.add(cv);
        if (!cells[rv]) cells[rv] = {};
        cells[rv][cv] = (cells[rv][cv] || 0) + 1;
      });

      pivotData = { rows: Array.from(rowSet), cols: Array.from(colSet), cells };
    }
  }

  // ── Summary stats (shared) ─────────────────────────────────────
  // Quick count for the header — cheap query
  const totalResponses = overviewData?.totalResponses ?? (await prisma.response.count({ where }));

  // ── Tabs config ────────────────────────────────────────────────
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'elements', label: 'Elements' },
    { key: 'trends', label: 'Trends' },
    { key: 'pivot', label: 'Pivot' },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <DashboardFeedback
            elementId="analytics-priorities-pro"
            mode="poll"
            promptText="What analytics would be most valuable?"
            options={[
              'Element benchmarking',
              'Anomaly alerts',
              'Rating trends over time',
              'Segment comparison',
              'AI summaries',
            ]}
            onePerUser={false}
            userEmail={dbUser?.email}
            userName={dbUser?.name ?? undefined}
            userProfile={{
              companySize: dbUser?.companySize ?? undefined,
              role: dbUser?.role ?? undefined,
              industry: dbUser?.industry ?? undefined,
              useCase: dbUser?.useCase ?? undefined,
              plan: 'PRO',
            }}
          />
        </div>
        <p className="text-gray-600">
          {selectedProject ? selectedProject.name : 'All projects'}
          {selectedElement ? ` / ${selectedElement}` : ''}
          {' \u2014 '}
          {dateRangeLabel}
          {' \u2014 '}
          <span className="font-medium">{totalResponses}</span> responses
        </p>
      </div>

      <AnalyticsFilter projects={projects} elements={elements} />

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-gray-200/80 -mx-1 px-1">
        {tabs.map((tab) => {
          const tabUrl = new URLSearchParams();
          if (params.startDate) tabUrl.set('startDate', params.startDate);
          if (params.endDate) tabUrl.set('endDate', params.endDate);
          if (params.projectId) tabUrl.set('projectId', params.projectId);
          if (params.elementId) tabUrl.set('elementId', params.elementId);
          if (tab.key !== 'overview') tabUrl.set('tab', tab.key);

          return (
            <Link
              key={tab.key}
              href={`/dashboard/analytics${tabUrl.toString() ? `?${tabUrl.toString()}` : ''}`}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
        <Link
          href="/dashboard/analytics/segments"
          className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex-shrink-0 border-transparent text-gray-400 hover:text-gray-600"
        >
          Segments
        </Link>
      </div>

      {/* Mobile segments link */}
      <Link
        href="/dashboard/analytics/segments"
        className="md:hidden flex items-center justify-between mb-6 px-4 py-3 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700"
      >
        User Segments
        <span className="text-gray-400">&rarr;</span>
      </Link>

      {/* Tab Content */}
      {activeTab === 'overview' && overviewData && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Responses"
              value={overviewData.totalResponses.toString()}
              delta={overviewData.deltas.totalResponses}
              deltaLabel="%"
            />
            <StatCard
              label="Avg Rating"
              value={overviewData.avgRating ? `${overviewData.avgRating}/5` : '-'}
              delta={overviewData.deltas.avgRating}
            />
            <StatCard
              label="Positive Rate"
              value={overviewData.positiveRate !== null ? `${overviewData.positiveRate}%` : '-'}
              delta={overviewData.deltas.positiveRate}
              deltaLabel="pp"
            />
            <StatCard
              label="Most Common"
              value={
                overviewData.modeData.length > 0
                  ? overviewData.modeData.sort((a, b) => b.value - a.value)[0].name
                  : '-'
              }
            />
          </div>

          <AnalyticsCharts
            trendData={overviewData.trendData}
            modeData={overviewData.modeData}
            sentimentData={overviewData.sentimentData}
            avgRatingData={[]}
            pollData={overviewData.pollData}
            elementPerformance={overviewData.elementPerformance}
            npsResult={overviewData.npsResult}
            ratingDistribution={overviewData.ratingDistribution}
            heatmapData={overviewData.heatmapData}
          />
        </>
      )}

      {activeTab === 'elements' && elementsTabData && (
        <ElementsTab
          elements={elementsTabData.benchmarks}
          anomalies={elementsTabData.anomalies}
          overallAvgRating={elementsTabData.overallAvgRating}
          overallPositiveRate={elementsTabData.overallPositiveRate}
          sparklineData={elementsTabData.sparklineData}
          archivedElementIds={archivedElementIds}
        />
      )}

      {activeTab === 'trends' && trendsTabData && <TrendsTab data={trendsTabData} />}

      {activeTab === 'pivot' && (
        <PivotTab
          data={pivotData}
          dimensions={allPivotDimensions}
          selectedRow={pivotRow}
          selectedCol={pivotCol}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  deltaLabel = '',
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-gray-900 capitalize">{value}</p>
        {delta !== null && delta !== undefined && (
          <span
            className={`text-xs font-medium ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-500' : 'text-gray-400'}`}
          >
            {delta > 0 ? '\u2191' : delta < 0 ? '\u2193' : ''}
            {delta > 0 ? '+' : ''}
            {delta}
            {deltaLabel}
          </span>
        )}
      </div>
    </div>
  );
}
