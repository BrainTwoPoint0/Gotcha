import { prisma } from '@/lib/prisma';
import { getAuthUser, getActiveOrganization } from '@/lib/auth';
import { ProfileForm, OrganizationForm } from './settings-forms';
import { TeamManagement } from './team-management';
import { PlanActions } from './plan-actions';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';
import { EditorialPageHeader } from '../../components/editorial/page-header';
import {
  EditorialCard,
  EditorialCardHeader,
  EditorialCardBody,
} from '../../components/editorial/card';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getAuthUser();

  const dbUser = user
    ? await prisma.user.findUnique({
        where: { email: user.email! },
      })
    : null;

  const activeOrg = user?.email ? await getActiveOrganization(user.email) : null;
  const organization = activeOrg?.organization;
  const subscription = organization?.subscription;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const projectIds = organization?.projects?.map((p: { id: string }) => p.id) || [];

  const [responsesThisMonth, totalResponses] =
    projectIds.length > 0
      ? await Promise.all([
          prisma.response.count({
            where: {
              projectId: { in: projectIds },
              createdAt: { gte: startOfMonth },
            },
          }),
          prisma.response.count({
            where: {
              projectId: { in: projectIds },
            },
          }),
        ])
      : [0, 0];

  const planLabel = subscription?.plan || 'FREE';
  const planLimit = getPlanLimitNum(planLabel);
  const usagePct = Math.min((responsesThisMonth / planLimit) * 100, 100);

  return (
    <div>
      <EditorialPageHeader
        eyebrow="Account & workspace"
        title="Settings"
        subtitle="Manage your profile, team, and subscription."
      />

      <div className="space-y-6">
        <EditorialCard>
          <EditorialCardHeader>
            <SectionTitle>Profile</SectionTitle>
          </EditorialCardHeader>
          <EditorialCardBody>
            <ProfileForm
              name={dbUser?.name || null}
              email={user?.email || ''}
              companySize={dbUser?.companySize || null}
              role={dbUser?.role || null}
              industry={dbUser?.industry || null}
              useCase={dbUser?.useCase || null}
            />
          </EditorialCardBody>
        </EditorialCard>

        <EditorialCard>
          <EditorialCardHeader>
            <SectionTitle>Workspace</SectionTitle>
          </EditorialCardHeader>
          <EditorialCardBody>
            <OrganizationForm name={organization?.name || ''} slug={organization?.slug || ''} />
          </EditorialCardBody>
        </EditorialCard>

        <EditorialCard>
          <EditorialCardHeader>
            <SectionTitle>Team</SectionTitle>
          </EditorialCardHeader>
          <EditorialCardBody>
            <TeamManagement />
          </EditorialCardBody>
        </EditorialCard>

        <EditorialCard>
          <EditorialCardHeader>
            <SectionTitle>Subscription</SectionTitle>
          </EditorialCardHeader>
          <EditorialCardBody>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                    Current plan
                  </p>
                  <p className="mt-1 font-display text-2xl font-normal leading-[1.1] tracking-[-0.01em] text-editorial-ink">
                    {planLabel === 'FREE' ? 'Free' : 'Pro'}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
                    subscription?.status === 'ACTIVE'
                      ? 'border-editorial-success/40 bg-editorial-success/[0.06] text-editorial-success'
                      : 'border-editorial-neutral-2 bg-editorial-paper text-editorial-neutral-3'
                  }`}
                >
                  {subscription?.status || 'Active'}
                </span>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                  Usage this month
                </p>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-display text-2xl font-normal leading-none tracking-[-0.01em] text-editorial-ink tabular-nums">
                    {responsesThisMonth.toLocaleString()}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-editorial-neutral-3">
                    / {getPlanLimit(planLabel)}
                  </span>
                </div>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-editorial-neutral-2">
                  <div
                    className="h-full rounded-full bg-editorial-accent transition-all duration-240 ease-page-turn"
                    style={{ width: `${usagePct}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                  All time
                </p>
                <span className="font-display text-[1.25rem] font-normal leading-none tracking-[-0.01em] text-editorial-ink tabular-nums">
                  {totalResponses.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-8 border-t border-editorial-neutral-2 pt-6">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                Available plans
              </p>
              <div className="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                <PlanCard
                  name="Free"
                  price="$0"
                  features={['500 responses/mo', '1 project', 'Basic analytics']}
                  current={!subscription?.plan || subscription?.plan === 'FREE'}
                />
                <PlanCard
                  name="Pro"
                  price="$29"
                  features={['Unlimited responses', 'Unlimited projects', 'Full analytics']}
                  current={subscription?.plan === 'PRO'}
                  popular
                />
              </div>
              <div className="mt-6">
                <PlanActions
                  currentPlan={planLabel}
                  hasStripeSubscription={!!subscription?.stripeSubId}
                />
              </div>
            </div>
          </EditorialCardBody>
        </EditorialCard>
      </div>

      {/* Per-page feedback widget — quiet hint, not a chrome element */}
      <div className="mt-12 flex items-center justify-center gap-3 text-[13px] text-editorial-neutral-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Improve this page</span>
        <DashboardFeedback
          elementId="settings-page"
          mode="feedback"
          promptText="How clear are these settings?"
          userEmail={dbUser?.email}
          userName={dbUser?.name ?? undefined}
          userProfile={{
            companySize: dbUser?.companySize ?? undefined,
            role: dbUser?.role ?? undefined,
            industry: dbUser?.industry ?? undefined,
            useCase: dbUser?.useCase ?? undefined,
            plan: planLabel,
            onboarded: !!dbUser?.onboardedAt,
          }}
        />
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[1.25rem] font-normal leading-[1.15] tracking-[-0.01em] text-editorial-ink">
      {children}
    </h2>
  );
}

function PlanCard({
  name,
  price,
  features,
  current,
  popular,
}: {
  name: string;
  price: string;
  features: string[];
  current?: boolean;
  popular?: boolean;
}) {
  return (
    <div
      className={`relative rounded-md border p-5 transition-colors duration-240 ease-page-turn ${
        current
          ? 'border-editorial-ink/40 bg-editorial-ink/[0.02]'
          : 'border-editorial-neutral-2 bg-editorial-paper'
      }`}
    >
      {popular && (
        <span className="absolute -top-2 left-5 inline-flex items-center rounded-md bg-editorial-accent px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-editorial-paper">
          Popular
        </span>
      )}
      <div className="flex items-baseline justify-between">
        <h4 className="font-display text-[1.125rem] font-normal leading-none tracking-[-0.01em] text-editorial-ink">
          {name}
        </h4>
        {current && (
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-editorial-accent">
            Current
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-[1.75rem] font-normal leading-none tracking-[-0.01em] text-editorial-ink">
        {price}
        {price !== 'Custom' && (
          <span className="ml-1 font-mono text-[11px] uppercase tracking-[0.14em] text-editorial-neutral-3">
            / mo
          </span>
        )}
      </p>
      <ul className="mt-4 space-y-1.5">
        {features.map((feature, i) => (
          <li
            key={i}
            className="flex items-center gap-2 text-[13px] leading-[1.5] text-editorial-neutral-3"
          >
            <span aria-hidden="true" className="font-mono text-[11px] text-editorial-success">
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

function getPlanLimit(plan: string): string {
  const limits: Record<string, string> = {
    FREE: '500',
    PRO: 'Unlimited',
  };
  return limits[plan] || '500';
}

function getPlanLimitNum(plan: string): number {
  const limits: Record<string, number> = {
    FREE: 500,
    PRO: 999999,
  };
  return limits[plan] || 500;
}
