import { prisma } from '@/lib/prisma';
import { getAuthUser, getActiveOrganization } from '@/lib/auth';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { canAccessBugFeatures } from '@/lib/plan-limits';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';

export const dynamic = 'force-dynamic';

// Linear-style desaturated badge configs
const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  OPEN: {
    label: 'Open',
    className: 'bg-red-50/80 text-red-700 border-red-200/60',
    dot: 'bg-red-500',
  },
  INVESTIGATING: {
    label: 'Investigating',
    className: 'bg-amber-50/80 text-amber-700 border-amber-200/60',
    dot: 'bg-amber-500',
  },
  FIXING: {
    label: 'Fixing',
    className: 'bg-blue-50/80 text-blue-700 border-blue-200/60',
    dot: 'bg-blue-500',
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60',
    dot: 'bg-emerald-500',
  },
  CLOSED: {
    label: 'Closed',
    className: 'bg-gray-50 text-gray-500 border-gray-200/60',
    dot: 'bg-gray-400',
  },
  WONT_FIX: {
    label: "Won't Fix",
    className: 'bg-gray-50 text-gray-500 border-gray-200/60',
    dot: 'bg-gray-400',
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'bg-gray-50 text-gray-500 border-gray-200/60' },
  MEDIUM: { label: 'Medium', className: 'bg-blue-50/80 text-blue-700 border-blue-200/60' },
  HIGH: { label: 'High', className: 'bg-orange-50/80 text-orange-700 border-orange-200/60' },
  CRITICAL: { label: 'Critical', className: 'bg-red-50/80 text-red-700 border-red-200/60' },
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function BugsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getAuthUser();

  const dbUser = user
    ? await prisma.user.findUnique({
        where: { email: user.email! },
      })
    : null;

  const activeOrg = user?.email ? await getActiveOrganization(user.email) : null;
  const organization = activeOrg?.organization;
  if (!organization) {
    return <div className="p-8 text-gray-500">No organization found.</div>;
  }

  const isPro = canAccessBugFeatures(organization.subscription?.plan ?? 'FREE');

  // Pro gate — show upgrade prompt for FREE users
  if (!isPro) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Bug Tickets</h1>
          <p className="text-gray-600">Track and manage bug reports from user feedback</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unlock Bug Tracking</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Upgrade to Pro to access bug tracking with ticket management, email notifications, and
            Slack/Discord integration.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-slate-700 hover:bg-slate-800"
          >
            Upgrade to Pro
          </Link>
          <div className="mt-8">
            <DashboardFeedback
              elementId="bugs-pro-gate"
              mode="poll"
              promptText="Which bug tracking features matter most to you?"
              options={[
                'Auto-assign to team members',
                'GitHub / Linear integration',
                'SLA tracking',
                'Duplicate detection',
                'Screenshots & recordings',
              ]}
              allowMultiple
              userEmail={dbUser?.email}
              userName={dbUser?.name ?? undefined}
              userProfile={{
                companySize: dbUser?.companySize ?? undefined,
                role: dbUser?.role ?? undefined,
                industry: dbUser?.industry ?? undefined,
                useCase: dbUser?.useCase ?? undefined,
                plan: 'FREE',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  const projectIds = (organization.projects ?? []).map((p) => p.id);

  // Filter by status tab
  const statusFilter = params.status || 'active';
  const where: Record<string, unknown> = {
    projectId: { in: projectIds },
  };

  if (statusFilter === 'active') {
    where.status = { in: ['OPEN', 'INVESTIGATING', 'FIXING'] };
  } else if (statusFilter === 'CLOSED') {
    where.status = { in: ['CLOSED', 'WONT_FIX'] };
  } else if (statusFilter !== 'all') {
    where.status = statusFilter;
  }

  // Get bugs + counts in parallel
  const [bugs, counts] = await Promise.all([
    prisma.bugTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        response: {
          select: { mode: true, content: true, rating: true, vote: true },
        },
        project: { select: { name: true } },
      },
    }),
    prisma.bugTicket.groupBy({
      by: ['status'],
      where: { projectId: { in: projectIds } },
      _count: true,
    }),
  ]);

  const countMap: Record<string, number> = {};
  let totalCount = 0;
  let activeCount = 0;
  for (const c of counts) {
    countMap[c.status] = c._count;
    totalCount += c._count;
    if (['OPEN', 'INVESTIGATING', 'FIXING'].includes(c.status)) {
      activeCount += c._count;
    }
  }

  const tabs = [
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'RESOLVED', label: 'Resolved', count: countMap['RESOLVED'] || 0 },
    {
      key: 'CLOSED',
      label: 'Closed',
      count: (countMap['CLOSED'] || 0) + (countMap['WONT_FIX'] || 0),
    },
    { key: 'all', label: 'All', count: totalCount },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Bug Tickets</h1>
          <DashboardFeedback
            elementId="bugs-list-page"
            mode="poll"
            promptText="What slows down your bug workflow?"
            options={[
              'Finding specific bugs',
              'Updating multiple bugs at once',
              'Knowing who is responsible',
              'Tracking resolution time',
              'Getting notified of changes',
            ]}
            allowMultiple
            onePerUser={false}
            userEmail={dbUser?.email}
            userName={dbUser?.name ?? undefined}
            userProfile={{
              companySize: dbUser?.companySize ?? undefined,
              role: dbUser?.role ?? undefined,
              industry: dbUser?.industry ?? undefined,
              useCase: dbUser?.useCase ?? undefined,
              plan: 'PRO',
            }}
          />
        </div>
        <p className="text-gray-600">Track and manage bug reports from user feedback</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200/80">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/dashboard/bugs${tab.key !== 'active' ? `?status=${tab.key}` : ''}`}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              statusFilter === tab.key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 text-xs ${
                statusFilter === tab.key ? 'text-gray-500' : 'text-gray-300'
              }`}
            >
              {tab.count}
            </span>
          </Link>
        ))}
      </div>

      {bugs.length === 0 ? (
        <Card className="text-center py-16">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No bugs found</h3>
          <p className="mt-2 text-gray-500">
            Bugs appear here when users flag feedback as bug reports.
          </p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full">
              <colgroup>
                <col className="w-[35%]" />
                <col className="w-[15%]" />
                <col className="w-[13%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[13%]" />
              </colgroup>
              <TableHeader>
                <TableRow className="border-b border-gray-200/80">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Title
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Element
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Priority
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Project
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bugs.map((bug) => {
                  const status = STATUS_CONFIG[bug.status] || STATUS_CONFIG.OPEN;
                  const priority = PRIORITY_CONFIG[bug.priority] || PRIORITY_CONFIG.MEDIUM;

                  return (
                    <TableRow
                      key={bug.id}
                      className="group transition-colors duration-100 hover:bg-gray-50/50"
                    >
                      <TableCell>
                        <Link
                          href={`/dashboard/bugs/${bug.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors line-clamp-1"
                        >
                          {bug.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                          {bug.elementId}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.className}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5`} />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priority.className}>
                          {priority.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">{bug.project.name}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm tabular-nums text-gray-400">
                          {formatDate(bug.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(date: Date): string {
  const m = MONTHS[date.getMonth()];
  const d = date.getDate();
  let h = date.getHours();
  const min = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${m} ${d}, ${h}:${min} ${ampm}`;
}
