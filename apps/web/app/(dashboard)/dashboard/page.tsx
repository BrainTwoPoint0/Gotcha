import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getPlanLimit, isOverLimit, shouldShowUpgradeWarning } from '@/lib/plan-limits';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';
import { OnboardingBanner } from './onboarding-banner';
import { OnboardingChecklist } from './onboarding-checklist';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { StatCard } from './stat-card';

export const dynamic = 'force-dynamic';

interface ResponseItem {
  id: string;
  mode: string;
  content: string | null;
  title: string | null;
  rating: number | null;
  vote: string | null;
  pollSelected: unknown;
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
                responsesResetAt: new Date(),
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
    const overLimit = subscription
      ? isOverLimit(subscription.plan, subscription.responsesThisMonth)
      : false;

    // Get recent responses (always show — first 500 are accessible)
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
        {!dbUser?.onboardedAt && <OnboardingBanner userName={dbUser?.name ?? undefined} />}

        <div className="mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <DashboardFeedback
              elementId="dashboard-overview"
              mode="vote"
              promptText="Is this dashboard useful?"
              voteLabels={{ up: 'Yes', down: 'No' }}
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
          <p className="text-gray-600">Welcome back{dbUser?.name ? `, ${dbUser.name}` : ''}!</p>
        </div>

        {/* Plan Limit Warnings */}
        {subscription && overLimit && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Response limit exceeded</AlertTitle>
            <AlertDescription>
              You've exceeded the 500 response limit for the Free plan. Your responses are still
              being collected, but you need to upgrade to Pro to view new data.{' '}
              <a href="/dashboard/settings" className="font-medium underline">
                Upgrade to Pro &rarr;
              </a>
            </AlertDescription>
          </Alert>
        )}

        {subscription &&
          !overLimit &&
          shouldShowUpgradeWarning(subscription.plan, subscription.responsesThisMonth) && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Approaching response limit</AlertTitle>
              <AlertDescription>
                You've used {subscription.responsesThisMonth} of 500 responses this month (
                {Math.round((subscription.responsesThisMonth / 500) * 100)}%). Upgrade to Pro for
                unlimited responses.{' '}
                <a href="/dashboard/settings" className="font-medium underline">
                  Upgrade to Pro &rarr;
                </a>
              </AlertDescription>
            </Alert>
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
          <Card className="p-6">
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
                        {Array.isArray(response.pollSelected) && response.pollSelected.length
                          ? response.pollSelected.join(', ')
                          : response.content ||
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
          </Card>

          {/* Projects */}
          <Card className="p-6">
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
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90"
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
          </Card>
        </div>

        {/* Onboarding Checklist */}
        {totalResponses === 0 && (
          <OnboardingChecklist
            hasProjects={projects.length > 0}
            hasResponses={totalResponses > 0}
            projectSlug={projects[0]?.slug}
            apiKey={undefined}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Dashboard Error</h1>
        <p className="text-gray-700">
          Something went wrong loading the dashboard. Please try refreshing the page.
        </p>
      </div>
    );
  }
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
