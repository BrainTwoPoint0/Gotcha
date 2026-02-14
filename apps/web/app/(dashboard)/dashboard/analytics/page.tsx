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
              promptText="What analytics would you like to see?"
              userEmail={dbUser?.email}
              userName={dbUser?.name ?? undefined}
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

  // Get responses for the selected period
  const responses = await prisma.response.findMany({
    where,
    select: {
      createdAt: true,
      mode: true,
      rating: true,
      vote: true,
      elementIdRaw: true,
      pollOptions: true,
      pollSelected: true,
    },
  });

  // Calculate date range for display
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const dateRangeLabel =
    params.startDate || params.endDate
      ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
      : 'Last 30 days';
  const selectedProject = projectId ? projects.find((p) => p.id === projectId) : null;
  const selectedElement = elementId || null;

  // Process data for charts
  const dailyCounts: Record<string, number> = {};
  const modeCounts: Record<string, number> = {};
  const voteCounts = { UP: 0, DOWN: 0 };
  const ratings: { date: string; rating: number }[] = [];

  // Initialize days in range
  const daysToShow = Math.min(daysDiff, 90); // Cap at 90 days for readability
  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    dailyCounts[key] = 0;
  }

  responses.forEach((r) => {
    // Daily counts
    const dateKey = r.createdAt.toISOString().split('T')[0];
    if (dailyCounts[dateKey] !== undefined) {
      dailyCounts[dateKey]++;
    }

    // Mode counts
    modeCounts[r.mode] = (modeCounts[r.mode] || 0) + 1;

    // Vote counts
    if (r.vote === 'UP') voteCounts.UP++;
    if (r.vote === 'DOWN') voteCounts.DOWN++;

    // Ratings
    if (r.rating) {
      ratings.push({ date: dateKey, rating: r.rating });
    }
  });

  // Poll aggregation
  const pollMap: Record<string, { elementId: string; optionCounts: Record<string, number> }> = {};
  responses.forEach((r) => {
    if (r.mode !== 'POLL' || !Array.isArray(r.pollSelected) || r.pollSelected.length === 0) return;
    if (!pollMap[r.elementIdRaw]) {
      const allOptions = Array.isArray(r.pollOptions) ? (r.pollOptions as string[]) : [];
      const optionCounts: Record<string, number> = {};
      allOptions.forEach((opt) => (optionCounts[opt] = 0));
      pollMap[r.elementIdRaw] = { elementId: r.elementIdRaw, optionCounts };
    }
    (r.pollSelected as string[]).forEach((sel) => {
      pollMap[r.elementIdRaw].optionCounts[sel] = (pollMap[r.elementIdRaw].optionCounts[sel] || 0) + 1;
    });
  });
  const pollData = Object.values(pollMap).map((p) => ({
    elementId: p.elementId,
    options: Object.entries(p.optionCounts).map(([name, count]) => ({ name, count })),
  }));

  // Element performance aggregation
  const elementMap: Record<
    string,
    { total: number; ratingSum: number; ratingCount: number; upVotes: number; downVotes: number }
  > = {};
  responses.forEach((r) => {
    if (!elementMap[r.elementIdRaw]) {
      elementMap[r.elementIdRaw] = { total: 0, ratingSum: 0, ratingCount: 0, upVotes: 0, downVotes: 0 };
    }
    const e = elementMap[r.elementIdRaw];
    e.total++;
    if (r.rating) { e.ratingSum += r.rating; e.ratingCount++; }
    if (r.vote === 'UP') e.upVotes++;
    if (r.vote === 'DOWN') e.downVotes++;
  });
  const elementPerformance = Object.entries(elementMap)
    .map(([elementId, e]) => ({
      elementId,
      total: e.total,
      avgRating: e.ratingCount > 0 ? Number((e.ratingSum / e.ratingCount).toFixed(1)) : null,
      positiveRate: e.upVotes + e.downVotes > 0 ? Math.round((e.upVotes / (e.upVotes + e.downVotes)) * 100) : null,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Format data for charts
  const trendData = Object.entries(dailyCounts).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    responses: count,
  }));

  const modeData = Object.entries(modeCounts).map(([mode, count]) => ({
    name: mode.toLowerCase().replace('_', ' '),
    value: count,
  }));

  const sentimentData = [
    { name: 'Positive', value: voteCounts.UP, color: '#22c55e' },
    { name: 'Negative', value: voteCounts.DOWN, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  // Calculate average rating per day
  const ratingsByDate: Record<string, number[]> = {};
  ratings.forEach(({ date, rating }) => {
    if (!ratingsByDate[date]) ratingsByDate[date] = [];
    ratingsByDate[date].push(rating);
  });

  const avgRatingData = Object.entries(ratingsByDate)
    .map(([date, ratings]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rating: Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)),
    }))
    .slice(-14); // Last 14 days with ratings

  // Summary stats
  const totalResponses = responses.length;
  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((a, b) => a + b.rating, 0) / ratings.length).toFixed(1)
      : null;
  const positiveRate =
    voteCounts.UP + voteCounts.DOWN > 0
      ? Math.round((voteCounts.UP / (voteCounts.UP + voteCounts.DOWN)) * 100)
      : null;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <DashboardFeedback
            elementId="analytics-page"
            promptText="What analytics would you like to see?"
            userEmail={dbUser?.email}
            userName={dbUser?.name ?? undefined}
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
