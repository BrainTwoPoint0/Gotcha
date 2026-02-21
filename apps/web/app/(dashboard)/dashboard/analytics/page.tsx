import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { AnalyticsCharts } from './charts';
import { AnalyticsFilter } from './analytics-filter';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    projectId?: string;
    elementId?: string;
  }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dbUser = user
    ? await prisma.user.findUnique({
        where: { email: user.email! },
        include: {
          memberships: {
            include: {
              organization: {
                include: {
                  subscription: true,
                },
              },
            },
          },
        },
      })
    : null;

  const organization = dbUser?.memberships[0]?.organization;
  const subscription = organization?.subscription;
  const isPro = subscription?.plan === 'PRO';

  // Pro gate - show upgrade prompt for FREE users or if no organization
  if (!isPro || !organization) {
    return (
      <div>
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <DashboardFeedback
              elementId="analytics-page"
              mode="poll"
              promptText="What analytics matter most to you?"
              options={[
                'Sentiment trends',
                'Response heatmaps',
                'User segments',
                'Comparison reports',
              ]}
              userEmail={dbUser?.email}
              userName={dbUser?.name ?? undefined}
              userProfile={{
                companySize: dbUser?.companySize ?? undefined,
                role: dbUser?.role ?? undefined,
                industry: dbUser?.industry ?? undefined,
                useCase: dbUser?.useCase ?? undefined,
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

  // Fetch projects for filter dropdown
  const projects = await prisma.project.findMany({
    where: { organizationId: organization.id },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });

  // Fetch unique elements for filter
  const elementsData = await prisma.response.groupBy({
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
  });

  const elements = elementsData.map((e) => ({
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

  // --- DB-level aggregation: run all queries in parallel ---
  const [modeCountsRaw, ratingAgg, voteCountsRaw, dailyTrendRaw, elementPerfRaw, pollResponses] =
    await Promise.all([
      // Mode counts (groupBy)
      prisma.response.groupBy({
        by: ['mode'],
        where,
        _count: { mode: true },
      }),
      // Average rating (aggregate)
      prisma.response.aggregate({
        where: { ...where, rating: { not: null } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      // Vote counts (groupBy)
      prisma.response.groupBy({
        by: ['vote'],
        where: { ...where, vote: { not: null } },
        _count: { vote: true },
      }),
      // Daily trend (groupBy by date - using raw query for date truncation)
      prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
      SELECT DATE("createdAt") as day, COUNT(*) as count
      FROM "Response"
      WHERE "projectId" IN (
        SELECT id FROM "Project" WHERE "organizationId" = ${organization.id}
        ${projectId ? prisma.$queryRaw`AND id = ${projectId}` : prisma.$queryRaw``}
      )
      ${elementId ? prisma.$queryRaw`AND "elementIdRaw" = ${elementId}` : prisma.$queryRaw``}
      AND "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
      GROUP BY DATE("createdAt")
      ORDER BY day
    `.catch(() => [] as Array<{ day: string; count: bigint }>),
      // Element performance (groupBy)
      prisma.response.groupBy({
        by: ['elementIdRaw'],
        where,
        _count: { elementIdRaw: true },
        _avg: { rating: true },
        orderBy: { _count: { elementIdRaw: 'desc' } },
        take: 10,
      }),
      // Poll responses (still needs JS — limited set)
      prisma.response.findMany({
        where: { ...where, mode: 'POLL' },
        select: {
          elementIdRaw: true,
          pollOptions: true,
          pollSelected: true,
        },
      }),
    ]);

  // Total responses from mode counts
  const totalResponses = modeCountsRaw.reduce((sum, m) => sum + m._count.mode, 0);

  // Format mode data
  const modeData = modeCountsRaw.map((m) => ({
    name: m.mode.toLowerCase().replace('_', ' '),
    value: m._count.mode,
  }));

  // Format vote counts
  const voteCounts = { UP: 0, DOWN: 0 };
  voteCountsRaw.forEach((v) => {
    if (v.vote === 'UP') voteCounts.UP = v._count.vote;
    if (v.vote === 'DOWN') voteCounts.DOWN = v._count.vote;
  });

  const sentimentData = [
    { name: 'Positive', value: voteCounts.UP, color: '#22c55e' },
    { name: 'Negative', value: voteCounts.DOWN, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  // Format average rating
  const avgRating = ratingAgg._avg.rating ? ratingAgg._avg.rating.toFixed(1) : null;

  const positiveRate =
    voteCounts.UP + voteCounts.DOWN > 0
      ? Math.round((voteCounts.UP / (voteCounts.UP + voteCounts.DOWN)) * 100)
      : null;

  // Format daily trend — fill in missing days with 0
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

  // Average rating data — reuse daily trend approach with a simpler query
  // (keeping lightweight: no separate per-day rating query, use overall avg)
  const avgRatingData: { date: string; rating: number }[] = [];

  // Poll aggregation (still needs JS for JSON array processing)
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

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <DashboardFeedback
            elementId="analytics-page"
            mode="poll"
            promptText="What analytics matter most to you?"
            options={[
              'Sentiment trends',
              'Response heatmaps',
              'User segments',
              'Comparison reports',
            ]}
            userEmail={dbUser?.email}
            userName={dbUser?.name ?? undefined}
            userProfile={{
              companySize: dbUser?.companySize ?? undefined,
              role: dbUser?.role ?? undefined,
              industry: dbUser?.industry ?? undefined,
              useCase: dbUser?.useCase ?? undefined,
            }}
          />
        </div>
        <p className="text-gray-600">
          {selectedProject ? selectedProject.name : 'All projects'}
          {selectedElement ? ` / ${selectedElement}` : ''}
          {' - '}
          {dateRangeLabel}
        </p>
      </div>

      <AnalyticsFilter projects={projects} elements={elements} />

      <Link
        href="/dashboard/analytics/segments"
        className="md:hidden flex items-center justify-between mb-6 px-4 py-3 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700"
      >
        User Segments
        <span className="text-gray-400">→</span>
      </Link>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Responses" value={totalResponses.toString()} />
        <StatCard label="Avg Rating" value={avgRating ? `${avgRating}/5` : '-'} />
        <StatCard label="Positive Rate" value={positiveRate !== null ? `${positiveRate}%` : '-'} />
        <StatCard
          label="Most Common"
          value={modeData.length > 0 ? modeData.sort((a, b) => b.value - a.value)[0].name : '-'}
        />
      </div>

      <AnalyticsCharts
        trendData={trendData}
        modeData={modeData}
        sentimentData={sentimentData}
        avgRatingData={avgRatingData}
        pollData={pollData}
        elementPerformance={elementPerformance}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 capitalize">{value}</p>
    </div>
  );
}
