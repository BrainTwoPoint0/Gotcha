import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { AnalyticsCharts } from './charts';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
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

  // Pro gate - show upgrade prompt for FREE users
  if (!isPro) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
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

  // Fetch analytics data for Pro users
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get daily response counts for the last 30 days
  const responses = await prisma.response.findMany({
    where: {
      project: { organizationId: organization.id },
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      createdAt: true,
      mode: true,
      rating: true,
      vote: true,
    },
  });

  // Process data for charts
  const dailyCounts: Record<string, number> = {};
  const modeCounts: Record<string, number> = {};
  const voteCounts = { UP: 0, DOWN: 0 };
  const ratings: { date: string; rating: number }[] = [];

  // Initialize last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
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
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Insights from the last 30 days</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
