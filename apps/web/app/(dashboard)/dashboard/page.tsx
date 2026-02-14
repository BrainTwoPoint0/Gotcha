import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getPlanLimit, isOverLimit, shouldShowUpgradeWarning } from '@/lib/plan-limits';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';

export const dynamic = 'force-dynamic';

interface ResponseItem {
  id: string;
  mode: string;
  content: string | null;
  title: string | null;
  rating: number | null;
  vote: string | null;
  createdAt: Date;
  project: { name: string; slug: string };
}

interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  _count: { responses: number };
}

export default async function DashboardPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get user's organization and stats
    let dbUser = user
      ? await prisma.user.findUnique({
          where: { email: user.email! },
          include: {
            memberships: {
              include: {
                organization: {
                  include: {
                    projects: {
                      include: {
                        _count: {
                          select: { responses: true },
                        },
                      },
                    },
                    subscription: true,
                  },
                },
              },
            },
          },
        })
      : null;

    // If user is authenticated but doesn't exist in our database, create them
    if (user?.email && !dbUser) {
      try {
        const newUser = await prisma.user.create({
          data: {
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatarUrl: user.user_metadata?.avatar_url || null,
          },
        });

        // Create a default organization for the user
        const orgSlug = user.email
          .split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-');
        await prisma.organization.create({
          data: {
            name: `${newUser.name || 'My'}'s Organization`,
            slug: `${orgSlug}-${Date.now()}`,
            members: {
              create: {
                userId: newUser.id,
                role: 'OWNER',
              },
            },
            subscription: {
              create: {
                plan: 'FREE',
                status: 'ACTIVE',
              },
            },
          },
        });
        // Re-fetch user with all relations
        dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: {
            memberships: {
              include: {
                organization: {
                  include: {
                    projects: {
                      include: {
                        _count: {
                          select: { responses: true },
                        },
                      },
                    },
                    subscription: true,
                  },
                },
              },
            },
          },
        });
      } catch (createError) {
        console.error('Error creating user in database:', createError);
        // Continue anyway - user can still see the dashboard, just without org data
      }
    }

    const organization = dbUser?.memberships[0]?.organization;
    const projects: ProjectItem[] = organization?.projects ?? [];
    const totalResponses = projects.reduce((sum, p) => sum + p._count.responses, 0);
    const subscription = organization?.subscription;

    // Get recent responses
    const recentResponses: ResponseItem[] = organization
      ? await prisma.response.findMany({
          where: {
            project: {
              organizationId: organization.id,
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            project: {
              select: { name: true, slug: true },
            },
          },
        })
      : [];

    return (
      <div>
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <DashboardFeedback
              elementId="dashboard-overview"
              promptText="How can we improve the dashboard?"
              userEmail={dbUser?.email}
              userName={dbUser?.name ?? undefined}
            />
          </div>
          <p className="text-gray-600">Welcome back{dbUser?.name ? `, ${dbUser.name}` : ''}!</p>
        </div>

        {/* Plan Limit Warnings */}
        {subscription && isOverLimit(subscription.plan, subscription.responsesThisMonth) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h3 className="font-medium text-red-800">Response limit exceeded</h3>
                <p className="text-sm text-red-700 mt-1">
                  You've exceeded the 500 response limit for the Free plan. New responses will not
                  be recorded until you upgrade.
                </p>
                <a
                  href="/dashboard/settings"
                  className="inline-block mt-2 text-sm font-medium text-red-800 hover:text-red-900 underline"
                >
                  Upgrade to Pro →
                </a>
              </div>
            </div>
          </div>
        )}

        {subscription &&
          !isOverLimit(subscription.plan, subscription.responsesThisMonth) &&
          shouldShowUpgradeWarning(subscription.plan, subscription.responsesThisMonth) && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-yellow-600 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h3 className="font-medium text-yellow-800">Approaching response limit</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    You've used {subscription.responsesThisMonth} of 500 responses this month (
                    {Math.round((subscription.responsesThisMonth / 500) * 100)}%). Upgrade to Pro
                    for unlimited responses.
                  </p>
                  <a
                    href="/dashboard/settings"
                    className="inline-block mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                  >
                    Upgrade to Pro →
                  </a>
                </div>
              </div>
            </div>
          )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard label="Total Responses" value={totalResponses.toString()} subtext="All time" />
          <StatCard label="Projects" value={projects.length.toString()} subtext="Active" />
          <StatCard
            label="Plan"
            value={subscription?.plan || 'Free'}
            subtext={
              subscription
                ? `${subscription.responsesThisMonth} / ${getPlanLimit(subscription.plan)} this month`
                : 'No subscription'
            }
          />
          <StatCard
            label="This Month"
            value={(subscription?.responsesThisMonth || 0).toString()}
            subtext="Responses collected"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Responses</h2>
              <Link
                href="/dashboard/responses"
                className="text-sm text-slate-600 hover:text-slate-500"
              >
                View all
              </Link>
            </div>

            {recentResponses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No responses yet.</p>
                <p className="text-sm mt-1">
                  Create a project and integrate the SDK to start collecting feedback.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentResponses.map((response) => (
                  <div
                    key={response.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className={`w-2 h-2 mt-2 rounded-full ${getModeColor(response.mode)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {response.content ||
                          response.title ||
                          `${response.mode.toLowerCase()} response`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {response.project.name} · {formatTimeAgo(response.createdAt)}
                      </p>
                    </div>
                    {response.rating && (
                      <span className="text-sm text-yellow-600">{'★'.repeat(response.rating)}</span>
                    )}
                    {response.vote && (
                      <span className={response.vote === 'UP' ? 'text-green-600' : 'text-red-600'}>
                        {response.vote === 'UP' ? '👍' : '👎'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Projects */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
              <Link
                href="/dashboard/projects"
                className="text-sm text-slate-600 hover:text-slate-500"
              >
                View all
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No projects yet.</p>
                <Link
                  href="/dashboard/projects/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-700 hover:bg-slate-800"
                >
                  Create your first project
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects/${project.slug}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-500">{project._count.responses} responses</p>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Start Guide */}
        {projects.length === 0 && (
          <div className="mt-8 bg-slate-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Start Guide</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-700 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Create a project</h3>
                  <p className="text-sm text-slate-700">
                    Set up your first project to get an API key.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-700 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Install the SDK</h3>
                  <p className="text-sm text-slate-700">npm install gotcha-feedback</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-700 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Add the G button</h3>
                  <p className="text-sm text-slate-700">Wrap your app and add Gotcha components.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Dashboard Error</h1>
        <p className="text-gray-700 mb-2">Something went wrong loading the dashboard.</p>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {error instanceof Error ? error.message : 'Unknown error'}
        </pre>
      </div>
    );
  }
}

function StatCard({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{subtext}</p>
    </div>
  );
}

function getModeColor(mode: string): string {
  const colors: Record<string, string> = {
    FEEDBACK: 'bg-slate-500',
    VOTE: 'bg-green-500',
    POLL: 'bg-purple-500',
    FEATURE_REQUEST: 'bg-orange-500',
    AB: 'bg-pink-500',
  };
  return colors[mode] || 'bg-gray-500';
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
