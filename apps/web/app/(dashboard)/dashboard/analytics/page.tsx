import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { getAuthUser, getActiveOrganization } from '@/lib/auth';
import {
  getDailyTrend,
  getPollSelectedCounts,
  getPollAvailableOptions,
  getNpsAggregation,
  getHeatmap,
  getElementSparklines,
  getDailyTrends,
  getDailyNpsRatings,
  getPivotData,
} from '@/lib/analytics-queries';
import Link from 'next/link';
import { AnalyticsCharts } from './charts';
import { AnalyticsFilter } from './analytics-filter';
import { ElementsTab } from './elements-tab';
import { TrendsTab } from './trends-tab';
import { PivotTab } from './pivot-tab';
import { EditorialPageHeader } from '../../components/editorial/page-header';
import { EditorialCard } from '../../components/editorial/card';
import { EditorialEmptyState } from '../../components/editorial/empty-state';
import { EditorialLinkButton } from '../../components/editorial/button';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';
import { calculateNPS } from '@/lib/nps';
import { parseDevice, parseBrowser } from '@/lib/ua-parser';

export const dynamic = 'force-dynamic';

/**
 * Cached overview data fetcher — revalidates every 60 seconds.
 * All args must be serializable (strings/numbers only).
 */
const fetchOverviewData = unstable_cache(
  async (
    orgId: string,
    pId: string, // empty string = no filter
    eId: string, // empty string = no filter
    startISO: string,
    endISO: string,
    daysDiff: number
  ) => {
    const startDate = new Date(startISO);
    const endDate = new Date(endISO);
    const projectId = pId || undefined;
    const elementId = eId || undefined;

    const where = {
      project: {
        organizationId: orgId,
        ...(projectId && { id: projectId }),
      },
      ...(elementId && { elementIdRaw: elementId }),
      createdAt: { gte: startDate, lte: endDate },
    };

    // Comparison period
    const periodMs = endDate.getTime() - startDate.getTime();
    const prevEnd = new Date(startDate.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - periodMs);
    const prevWhere = {
      project: {
        organizationId: orgId,
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
      pollCountsRaw,
      pollOptionsRaw,
      npsAggRaw,
      ratingDistRaw,
      heatmapRaw,
      prevCount,
      prevRatingAgg,
      prevVoteCountsRaw,
    ] = await Promise.all([
      prisma.response.groupBy({ by: ['mode'], where, _count: { mode: true } }).catch(() => []),
      prisma.response
        .aggregate({
          where: { ...where, rating: { not: null } },
          _avg: { rating: true },
          _count: { rating: true },
        })
        .catch(() => ({ _avg: { rating: null }, _count: { rating: 0 } })),
      prisma.response
        .groupBy({
          by: ['vote'],
          where: { ...where, vote: { not: null } },
          _count: { vote: true },
        })
        .catch(() => []),
      getDailyTrend(orgId, projectId, elementId, startDate, endDate),
      prisma.response
        .groupBy({
          by: ['elementIdRaw'],
          where,
          _count: { elementIdRaw: true },
          _avg: { rating: true },
          orderBy: { _count: { elementIdRaw: 'desc' } },
          take: 10,
        })
        .catch(() => []),
      getPollSelectedCounts(orgId, projectId, elementId, startDate, endDate),
      getPollAvailableOptions(orgId, projectId, elementId, startDate, endDate),
      getNpsAggregation(orgId, projectId, elementId, startDate, endDate),
      prisma.response
        .groupBy({
          by: ['rating'],
          where: { ...where, mode: 'FEEDBACK', rating: { not: null } },
          _count: { rating: true },
        })
        .catch(() => []),
      getHeatmap(orgId, projectId, elementId, startDate, endDate),
      prisma.response.count({ where: prevWhere }).catch(() => 0),
      prisma.response
        .aggregate({
          where: { ...prevWhere, rating: { not: null } },
          _avg: { rating: true },
        })
        .catch(() => ({ _avg: { rating: null } })),
      prisma.response
        .groupBy({
          by: ['vote'],
          where: { ...prevWhere, vote: { not: null } },
          _count: { vote: true },
        })
        .catch(() => []),
    ]);

    // Post-processing
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

    // Daily trend
    const dailyCounts: Record<string, number> = {};
    const daysToShow = Math.min(daysDiff, 90);
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      dailyCounts[date.toISOString().split('T')[0]] = 0;
    }
    dailyTrendRaw.forEach((row) => {
      const key =
        typeof row.day === 'string'
          ? row.day.split('T')[0]
          : new Date(row.day).toISOString().split('T')[0];
      if (dailyCounts[key] !== undefined) dailyCounts[key] = Number(row.count);
    });
    const trendData = Object.entries(dailyCounts).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      responses: count,
    }));

    // Poll
    const pollMap: Record<string, Record<string, number>> = {};
    for (const row of pollOptionsRaw) {
      if (!pollMap[row.elementIdRaw]) pollMap[row.elementIdRaw] = {};
      if (!(row.option in pollMap[row.elementIdRaw])) pollMap[row.elementIdRaw][row.option] = 0;
    }
    for (const row of pollCountsRaw) {
      if (!pollMap[row.elementIdRaw]) pollMap[row.elementIdRaw] = {};
      pollMap[row.elementIdRaw][row.selected_option] = Number(row.count);
    }
    const pollData = Object.entries(pollMap).map(([elId, optionCounts]) => ({
      elementId: elId,
      options: Object.entries(optionCounts).map(([name, count]) => ({ name, count })),
    }));

    // Element performance + vote breakdown
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

    // NPS
    const npsRow = npsAggRaw[0];
    const npsResult =
      npsRow && Number(npsRow.total) > 0
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

    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => {
      const found = ratingDistRaw.find((r) => r.rating === rating);
      return { rating, count: found ? found._count.rating : 0 };
    });

    const heatmapData = heatmapRaw.map((row) => ({
      dow: row.dow === 0 ? 6 : row.dow - 1,
      hour: row.hour,
      count: Number(row.count),
    }));

    // Deltas
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

    return {
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
      deltas: {
        totalResponses:
          prevCount > 0 ? Math.round(((totalResponses - prevCount) / prevCount) * 100) : null,
        avgRating:
          avgRating !== null && prevAvgRating !== null
            ? Number((parseFloat(avgRating) - prevAvgRating).toFixed(1))
            : null,
        positiveRate:
          positiveRate !== null && prevPositiveRate !== null
            ? positiveRate - prevPositiveRate
            : null,
      },
    };
  },
  ['analytics-overview'],
  { revalidate: 60, tags: ['analytics-overview'] }
);

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
        <EditorialPageHeader
          title="Analytics"
          subtitle="Insights into your feedback data."
          action={
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
          }
        />
        <EditorialCard>
          <EditorialEmptyState
            title="Analytics is a Pro feature"
            body="Upgrade to Pro to unlock response trends, sentiment analysis, element benchmarks, and rating insights across all your projects."
            action={
              <EditorialLinkButton href="/dashboard/settings" variant="ink">
                Upgrade to Pro →
              </EditorialLinkButton>
            }
          />
        </EditorialCard>
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

  // Overview tab data (cached — 60s revalidation)
  let overviewData = null;
  if (activeTab === 'overview') {
    overviewData = await fetchOverviewData(
      organization.id,
      projectId ?? '',
      elementId ?? '',
      startDate.toISOString(),
      endDate.toISOString(),
      daysDiff
    );
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
      getElementSparklines(organization.id, projectId, elementId, startDate, endDate),
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
    const [trendsRaw, npsRaw] = await Promise.all([
      getDailyTrends(organization.id, projectId, elementId, startDate, endDate),
      getDailyNpsRatings(organization.id, projectId, elementId, startDate, endDate),
    ]);

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
    const DB_PIVOT_KEYS = ['mode', 'rating', 'vote', 'status', 'element'];

    const rowIsDb = DB_PIVOT_KEYS.includes(pivotRow);
    const colIsDb = DB_PIVOT_KEYS.includes(pivotCol);

    if (rowIsDb && colIsDb) {
      // Pure SQL pivot (getPivotData validates keys against its own allowlist)
      const rawRows = await getPivotData(
        organization.id,
        projectId,
        elementId,
        startDate,
        endDate,
        pivotRow,
        pivotCol
      );

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
      <EditorialPageHeader
        eyebrow={
          <>
            {selectedProject ? selectedProject.name : 'All projects'}
            {selectedElement ? ` / ${selectedElement}` : ''}
            {' · '}
            {dateRangeLabel}
            {' · '}
            {totalResponses.toLocaleString()} responses
          </>
        }
        title="Analytics"
        subtitle="Trends, benchmarks, and rating insights across your feedback."
        action={
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
        }
      />

      <AnalyticsFilter projects={projects} elements={elements} />

      {/* Tab Navigation — editorial hairline underline */}
      <div className="mb-6 flex items-center gap-1 overflow-x-auto border-b border-editorial-neutral-2">
        {tabs.map((tab) => {
          const tabUrl = new URLSearchParams();
          if (params.startDate) tabUrl.set('startDate', params.startDate);
          if (params.endDate) tabUrl.set('endDate', params.endDate);
          if (params.projectId) tabUrl.set('projectId', params.projectId);
          if (params.elementId) tabUrl.set('elementId', params.elementId);
          if (tab.key !== 'overview') tabUrl.set('tab', tab.key);

          const active = activeTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/dashboard/analytics${tabUrl.toString() ? `?${tabUrl.toString()}` : ''}`}
              className={`relative inline-flex h-11 shrink-0 items-center whitespace-nowrap px-3 text-[14px] transition-colors duration-240 ease-page-turn ${
                active ? 'text-editorial-ink' : 'text-editorial-neutral-3 hover:text-editorial-ink'
              }`}
            >
              {tab.label}
              {active && (
                <span
                  className="absolute inset-x-3 -bottom-px h-px bg-editorial-ink"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
        <Link
          href="/dashboard/analytics/segments"
          className="inline-flex h-11 shrink-0 items-center whitespace-nowrap px-3 text-[14px] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
        >
          Segments
        </Link>
      </div>

      {/* Mobile segments link */}
      <Link
        href="/dashboard/analytics/segments"
        className="md:hidden mb-6 flex items-center justify-between rounded-md border border-editorial-neutral-2 bg-editorial-paper px-4 py-3 text-[14px] text-editorial-ink"
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
