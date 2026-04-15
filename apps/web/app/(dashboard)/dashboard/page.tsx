import { prisma } from '@/lib/prisma';
import { getAuthUser, getActiveOrganization, fetchActiveOrganization } from '@/lib/auth';
import Link from 'next/link';
import { getPlanLimit, isOverLimit, shouldShowUpgradeWarning } from '@/lib/plan-limits';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';
import { OnboardingBanner } from './onboarding-banner';
import { OnboardingChecklist } from './onboarding-checklist';
import { StatCard } from './stat-card';
import { EditorialPageHeader } from '../components/editorial/page-header';
import {
  EditorialCard,
  EditorialCardHeader,
  EditorialCardBody,
} from '../components/editorial/card';
import { EditorialLinkButton } from '../components/editorial/button';
import { EditorialEmptyState } from '../components/editorial/empty-state';

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
    const user = await getAuthUser();

    let activeOrg = user?.email ? await getActiveOrganization(user.email) : null;

    if (user?.email && !activeOrg) {
      try {
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {},
          create: {
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatarUrl: user.user_metadata?.avatar_url || null,
          },
        });

        const orgSlug = user.email
          .split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-');
        await prisma.organization.create({
          data: {
            name: `${dbUser.name || 'My'}'s Organization`,
            slug: `${orgSlug}-${Date.now()}`,
            members: {
              create: {
                userId: dbUser.id,
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

        activeOrg = await fetchActiveOrganization(user.email);
      } catch (createError) {
        console.error(
          'Error creating user in database:',
          createError instanceof Error ? createError.message : 'Unknown error'
        );
      }
    }
    const organization = activeOrg?.organization;

    const [dbUser, projects, recentResponses] = organization
      ? await Promise.all([
          prisma.user.findUnique({ where: { email: user!.email! } }),
          prisma.project.findMany({
            where: { organizationId: organization.id },
            include: { _count: { select: { responses: true } } },
          }) as Promise<ProjectItem[]>,
          prisma.response.findMany({
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
          }) as Promise<ResponseItem[]>,
        ])
      : [null, [] as ProjectItem[], [] as ResponseItem[]];

    const totalResponses = projects.reduce((sum, p) => sum + p._count.responses, 0);
    const subscription = organization?.subscription;
    const overLimit = subscription
      ? isOverLimit(subscription.plan, subscription.responsesThisMonth)
      : false;
    const warnLimit =
      subscription &&
      !overLimit &&
      shouldShowUpgradeWarning(subscription.plan, subscription.responsesThisMonth);

    // First-run surface: brand-new user with no projects and no responses.
    // The stat-zero row + dual empty panels communicate nothing — suppress
    // them and let the onboarding checklist carry the screen. Once the user
    // has at least one project OR at least one response, fall back to the
    // populated layout with its stats + recent-activity panels.
    const isFirstRun = projects.length === 0 && totalResponses === 0;

    return (
      <div>
        {!dbUser?.onboardedAt && <OnboardingBanner userName={dbUser?.name ?? undefined} />}

        <EditorialPageHeader
          eyebrow={dbUser?.name ? `Welcome back, ${dbUser.name}` : 'Welcome back'}
          title="Overview"
          subtitle="Everything that is happening across your projects, in one place."
        />

        {overLimit && (
          <div className="mb-6 flex items-start gap-3 border-l-2 border-editorial-alert bg-editorial-alert/[0.04] px-5 py-4 text-[14px] text-editorial-ink">
            <div className="flex-1">
              <p className="font-medium">Response limit exceeded.</p>
              <p className="mt-1 text-editorial-neutral-3">
                You have exceeded the {getPlanLimit(subscription!.plan)} response limit. Your
                responses are still being collected, but you need to upgrade to Pro to view new
                data.{' '}
                <Link
                  href="/dashboard/settings"
                  className="underline decoration-editorial-alert decoration-1 underline-offset-4 transition-colors hover:text-editorial-alert"
                >
                  Upgrade to Pro →
                </Link>
              </p>
            </div>
          </div>
        )}

        {warnLimit && (
          <div className="mb-6 flex items-center gap-3 border-t border-editorial-neutral-2 pt-4 text-[13px] text-editorial-neutral-3">
            <span
              className="h-1 w-1 shrink-0 rounded-full bg-editorial-accent"
              aria-hidden="true"
            />
            <span>
              <span className="text-editorial-ink">
                {subscription.responsesThisMonth} of {getPlanLimit(subscription.plan)} responses
                used this month.
              </span>{' '}
              <Link
                href="/dashboard/settings"
                className="underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:decoration-editorial-accent"
              >
                Upgrade to Pro
              </Link>{' '}
              for unlimited.
            </span>
          </div>
        )}

        {!isFirstRun && (
          <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total responses"
              value={totalResponses.toLocaleString()}
              subtext="All time"
            />
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
              label="This month"
              value={(subscription?.responsesThisMonth || 0).toLocaleString()}
              subtext="Responses collected"
            />
          </div>
        )}

        {!isFirstRun && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <EditorialCard>
              <EditorialCardHeader className="flex items-center justify-between">
                <h2 className="font-display text-[1.25rem] font-normal leading-[1.15] tracking-[-0.01em] text-editorial-ink">
                  Recent responses
                </h2>
                <Link
                  href="/dashboard/responses"
                  className="text-[13px] text-editorial-neutral-3 underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:text-editorial-ink hover:decoration-editorial-accent"
                >
                  View all →
                </Link>
              </EditorialCardHeader>
              <EditorialCardBody>
                {recentResponses.length === 0 ? (
                  <EditorialEmptyState
                    title="No responses yet"
                    body="Create a project and install the SDK to start collecting."
                    action={
                      <EditorialLinkButton href="/dashboard/responses" variant="ghost" size="sm">
                        How to set up →
                      </EditorialLinkButton>
                    }
                  />
                ) : (
                  <ul className="-my-2 divide-y divide-editorial-neutral-2">
                    {recentResponses.map((response) => (
                      <li key={response.id} className="flex items-start gap-4 py-3">
                        <span
                          aria-hidden="true"
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-editorial-neutral-3/60"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] text-editorial-ink">
                            {Array.isArray(response.pollSelected) && response.pollSelected.length
                              ? response.pollSelected.join(', ')
                              : response.content ||
                                response.title ||
                                `${response.mode.toLowerCase()} response`}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-editorial-neutral-3">
                            {response.project.name} · {formatTimeAgo(response.createdAt)}
                          </p>
                        </div>
                        {response.rating && response.mode === 'NPS' && (
                          <span className="shrink-0 font-display text-[14px] text-editorial-ink">
                            {response.rating}
                            <span className="text-editorial-neutral-3">/10</span>
                          </span>
                        )}
                        {response.rating && response.mode !== 'NPS' && (
                          <span className="shrink-0 font-display text-[14px] text-editorial-accent">
                            {'★'.repeat(response.rating)}
                          </span>
                        )}
                        {response.vote && (
                          <span
                            className={`shrink-0 text-[13px] ${response.vote === 'UP' ? 'text-editorial-success' : 'text-editorial-alert'}`}
                          >
                            {response.vote === 'UP' ? 'Up' : 'Down'}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </EditorialCardBody>
            </EditorialCard>

            <EditorialCard>
              <EditorialCardHeader className="flex items-center justify-between">
                <h2 className="font-display text-[1.25rem] font-normal leading-[1.15] tracking-[-0.01em] text-editorial-ink">
                  Projects
                </h2>
                <Link
                  href="/dashboard/projects"
                  className="text-[13px] text-editorial-neutral-3 underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:text-editorial-ink hover:decoration-editorial-accent"
                >
                  View all →
                </Link>
              </EditorialCardHeader>
              <EditorialCardBody>
                {projects.length === 0 ? (
                  <EditorialEmptyState
                    title="No projects yet"
                    body="A project groups feedback from one surface — create your first to get going."
                    action={
                      <EditorialLinkButton href="/dashboard/projects/new" variant="ink" size="sm">
                        Create project →
                      </EditorialLinkButton>
                    }
                  />
                ) : (
                  <ul className="-my-2 divide-y divide-editorial-neutral-2">
                    {projects.slice(0, 5).map((project) => (
                      <li key={project.id}>
                        <Link
                          href={`/dashboard/projects/${project.slug}`}
                          className="group flex items-center justify-between gap-4 py-3 transition-colors duration-240 ease-page-turn"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[14px] text-editorial-ink">
                              {project.name}
                            </p>
                            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-editorial-neutral-3">
                              {project._count.responses.toLocaleString()} response
                              {project._count.responses === 1 ? '' : 's'}
                            </p>
                          </div>
                          <span
                            aria-hidden="true"
                            className="text-editorial-neutral-3 transition-all duration-240 ease-page-turn group-hover:translate-x-0.5 group-hover:text-editorial-ink"
                          >
                            →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </EditorialCardBody>
            </EditorialCard>
          </div>
        )}

        {totalResponses === 0 && (
          <div className={isFirstRun ? '' : 'mt-12'}>
            <OnboardingChecklist
              hasProjects={projects.length > 0}
              hasResponses={totalResponses > 0}
              projectSlug={projects[0]?.slug}
              apiKey={undefined}
            />
          </div>
        )}

        {/* Per-page feedback widget — quiet hint, not a chrome element */}
        <div className="mt-12 flex items-center justify-center gap-3 text-[13px] text-editorial-neutral-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
            Improve this page
          </span>
          <DashboardFeedback
            elementId="dashboard-nps"
            mode="nps"
            onePerUser={false}
            promptText="How likely are you to recommend Gotcha to a colleague?"
            userEmail={dbUser?.email}
            userName={dbUser?.name ?? undefined}
            userProfile={{
              companySize: dbUser?.companySize ?? undefined,
              role: dbUser?.role ?? undefined,
              industry: dbUser?.industry ?? undefined,
              useCase: dbUser?.useCase ?? undefined,
              plan: activeOrg?.isPro ? 'PRO' : 'FREE',
              accountAgeDays: dbUser?.createdAt
                ? Math.floor((Date.now() - dbUser.createdAt.getTime()) / 86400000)
                : undefined,
              onboarded: !!dbUser?.onboardedAt,
              totalResponses,
            }}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="rounded-md border border-editorial-alert/30 bg-editorial-alert/[0.04] p-8 text-editorial-ink">
        <h1 className="font-display text-2xl text-editorial-alert">Dashboard error</h1>
        <p className="mt-2 text-[14px] text-editorial-neutral-3">
          Something went wrong loading the dashboard. Please refresh the page.
        </p>
      </div>
    );
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
