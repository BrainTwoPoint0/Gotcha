import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { InsightsCharts } from './insights-charts';

export const dynamic = 'force-dynamic';

const PROFILE_FIELDS = ['companySize', 'role', 'industry', 'useCase'] as const;

const FIELD_LABELS: Record<string, string> = {
  companySize: 'Company Size',
  role: 'Role',
  industry: 'Industry',
  useCase: 'Use Case',
};

const VALUE_LABELS: Record<string, Record<string, string>> = {
  companySize: {
    solo: 'Solo / Freelancer',
    '2-10': '2–10 employees',
    '11-50': '11–50 employees',
    '50+': '50+ employees',
  },
  role: {
    founder: 'Founder / CEO',
    engineer: 'Engineer',
    pm: 'Product Manager',
    designer: 'Designer',
    other: 'Other',
  },
  industry: {
    saas: 'SaaS',
    ecommerce: 'E-commerce',
    education: 'Education',
    healthcare: 'Healthcare',
    agency: 'Agency',
    fintech: 'Fintech / VC',
    analytics: 'Analytics / Data',
    media: 'Media / Content',
    devtools: 'Developer Tools',
    other: 'Other',
  },
  useCase: {
    'user-feedback': 'User Feedback',
    'feature-validation': 'Feature Validation',
    'bug-reports': 'Bug Reports',
    nps: 'NPS / Satisfaction',
    polls: 'Polls',
    other: 'Other',
  },
};

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const activeOrg = user.email ? await getActiveOrganization(user.email) : null;
  if (!activeOrg) {
    redirect('/login');
  }

  const orgMemberFilter = {
    memberships: { some: { organizationId: activeOrg.organization.id } },
  };

  const [totalUsers, ...groupResults] = await Promise.all([
    prisma.user.count({ where: orgMemberFilter }),
    ...PROFILE_FIELDS.map((field) =>
      prisma.user.groupBy({
        by: [field],
        _count: { [field]: true },
        where: { [field]: { not: null }, ...orgMemberFilter },
      })
    ),
  ]);

  const aggregates: Record<
    string,
    { label: string; data: { name: string; value: number }[] }
  > = {};

  PROFILE_FIELDS.forEach((field, i) => {
    aggregates[field] = {
      label: FIELD_LABELS[field],
      data: (groupResults[i] as Record<string, unknown>[]).map((row) => {
        const rawValue = row[field] as string;
        return {
          name: VALUE_LABELS[field]?.[rawValue] || rawValue,
          value: (row._count as Record<string, number>)[field],
        };
      }),
    };
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
        <p className="text-gray-600">
          Understand your user base — {totalUsers} total user{totalUsers !== 1 ? 's' : ''}
        </p>
      </div>

      <InsightsCharts aggregates={aggregates} totalUsers={totalUsers} />
    </div>
  );
}
