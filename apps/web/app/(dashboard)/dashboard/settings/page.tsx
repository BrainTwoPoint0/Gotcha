import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm, OrganizationForm } from './settings-forms';
import { PlanActions } from './plan-actions';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
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
                  projects: true,
                },
              },
            },
          },
        },
      })
    : null;

  const organization = dbUser?.memberships[0]?.organization;
  const subscription = organization?.subscription;

  // Get actual response count for this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const projectIds = organization?.projects?.map((p: { id: string }) => p.id) || [];

  const responsesThisMonth =
    projectIds.length > 0
      ? await prisma.response.count({
          where: {
            projectId: { in: projectIds },
            createdAt: { gte: startOfMonth },
          },
        })
      : 0;

  const totalResponses =
    projectIds.length > 0
      ? await prisma.response.count({
          where: {
            projectId: { in: projectIds },
          },
        })
      : 0;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <DashboardFeedback
            elementId="settings-page"
            mode="vote"
            promptText="Is the setup process clear?"
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
        <p className="text-gray-600">Manage your account and organization</p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              name={dbUser?.name || null}
              email={user?.email || ''}
              companySize={dbUser?.companySize || null}
              role={dbUser?.role || null}
              industry={dbUser?.industry || null}
              useCase={dbUser?.useCase || null}
            />
          </CardContent>
        </Card>

        {/* Organization Section */}
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <OrganizationForm name={organization?.name || ''} slug={organization?.slug || ''} />
          </CardContent>
        </Card>

        {/* Subscription Section */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Label className="text-muted-foreground">Current Plan</Label>
                  <p className="mt-1 text-gray-900 font-semibold">{subscription?.plan || 'Free'}</p>
                </div>
                <Badge variant={subscription?.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {subscription?.status || 'Active'}
                </Badge>
              </div>
              <div>
                <Label className="text-muted-foreground">Usage This Month</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{responsesThisMonth} responses</span>
                    <span className="text-gray-400">
                      / {getPlanLimit(subscription?.plan || 'FREE')}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      (responsesThisMonth / getPlanLimitNum(subscription?.plan || 'FREE')) * 100,
                      100
                    )}
                    className="h-2"
                  />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Total Responses (All Time)</Label>
                <p className="mt-1 text-gray-900 font-semibold">{totalResponses}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Available Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
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
              <PlanActions currentPlan={subscription?.plan || 'FREE'} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
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
    <Card className={`relative ${current ? 'border-primary bg-primary/5' : ''}`}>
      {popular && <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">Popular</Badge>}
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">{name}</h4>
          {current && <span className="text-xs text-primary font-medium">Current</span>}
        </div>
        <p className="mt-1 text-2xl font-bold">
          {price}
          {price !== 'Custom' && (
            <span className="text-sm font-normal text-muted-foreground">/mo</span>
          )}
        </p>
        <ul className="mt-3 space-y-1">
          {features.map((feature, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-center gap-1">
              <svg
                className="w-4 h-4 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
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
