import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm, OrganizationForm } from './settings-forms';
import { PlanActions } from './plan-actions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const dbUser = user ? await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      memberships: {
        include: {
          organization: {
            include: {
              subscription: true,
              projects: true,
            }
          }
        }
      }
    }
  }) : null;

  const organization = dbUser?.memberships[0]?.organization;
  const subscription = organization?.subscription;

  // Get actual response count for this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const projectIds = organization?.projects?.map((p: { id: string }) => p.id) || [];

  const responsesThisMonth = projectIds.length > 0 ? await prisma.response.count({
    where: {
      projectId: { in: projectIds },
      createdAt: { gte: startOfMonth },
    },
  }) : 0;

  const totalResponses = projectIds.length > 0 ? await prisma.response.count({
    where: {
      projectId: { in: projectIds },
    },
  }) : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and organization</p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
          <ProfileForm name={dbUser?.name || null} email={user?.email || ''} />
        </div>

        {/* Organization Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization</h2>
          <OrganizationForm
            name={organization?.name || ''}
            slug={organization?.slug || ''}
          />
        </div>

        {/* Subscription Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-500">Current Plan</label>
                <p className="mt-1 text-gray-900 font-semibold">{subscription?.plan || 'Free'}</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                subscription?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {subscription?.status || 'Active'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Usage This Month</label>
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{responsesThisMonth} responses</span>
                  <span className="text-gray-400">/ {getPlanLimit(subscription?.plan || 'FREE')}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-slate-700 h-2 rounded-full"
                    style={{
                      width: `${Math.min((responsesThisMonth / getPlanLimitNum(subscription?.plan || 'FREE')) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Total Responses (All Time)</label>
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
        </div>
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
    <div className={`relative rounded-lg border p-4 ${current ? 'border-slate-600 bg-slate-50' : 'border-gray-200'}`}>
      {popular && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-white">
          Popular
        </span>
      )}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">{name}</h4>
        {current && (
          <span className="text-xs text-slate-600 font-medium">Current</span>
        )}
      </div>
      <p className="mt-1 text-2xl font-bold text-gray-900">
        {price}
        {price !== 'Custom' && <span className="text-sm font-normal text-gray-500">/mo</span>}
      </p>
      <ul className="mt-3 space-y-1">
        {features.map((feature, i) => (
          <li key={i} className="text-sm text-gray-600 flex items-center gap-1">
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
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
