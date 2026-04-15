import { prisma } from '@/lib/prisma';
import { getAuthUser, getActiveOrganization } from '@/lib/auth';
import Link from 'next/link';
import { canAccessBugFeatures } from '@/lib/plan-limits';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';
import { Pagination } from '../../components/pagination';
import { EditorialPageHeader } from '../../components/editorial/page-header';
import { EditorialCard } from '../../components/editorial/card';
import { EditorialEmptyState } from '../../components/editorial/empty-state';
import { ProGateOverlay } from '../../components/editorial/pro-gate-overlay';
import {
  EditorialTable,
  EditorialTHead,
  EditorialTBody,
  EditorialTR,
  EditorialTH,
  EditorialTD,
} from '../../components/editorial/table';

export const dynamic = 'force-dynamic';

const STATUS_CONFIG: Record<string, { label: string; tone: string }> = {
  OPEN: { label: 'Open', tone: 'text-editorial-accent' },
  INVESTIGATING: { label: 'Investigating', tone: 'text-editorial-neutral-3' },
  FIXING: { label: 'Fixing', tone: 'text-editorial-ink' },
  RESOLVED: { label: 'Resolved', tone: 'text-editorial-success' },
  CLOSED: { label: 'Closed', tone: 'text-editorial-neutral-3/70' },
  WONT_FIX: { label: "Won't fix", tone: 'text-editorial-neutral-3/70' },
};

const PRIORITY_CONFIG: Record<string, { label: string; tone: string }> = {
  LOW: { label: 'Low', tone: 'text-editorial-neutral-3/80' },
  MEDIUM: { label: 'Medium', tone: 'text-editorial-neutral-3' },
  HIGH: { label: 'High', tone: 'text-editorial-accent' },
  CRITICAL: { label: 'Critical', tone: 'text-editorial-alert' },
};

const LIMIT = 20;

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
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
    return (
      <div>
        <EditorialPageHeader title="Bugs" subtitle="No organization found." />
      </div>
    );
  }

  const isPro = canAccessBugFeatures(organization.subscription?.plan ?? 'FREE');

  if (!isPro) {
    return (
      <div>
        <EditorialPageHeader
          title="Bugs"
          subtitle="Track and manage bug reports from user feedback."
        />
        <ProGateOverlay
          eyebrow="Pro · Bugs"
          title="Turn bug reports into tracked tickets"
          body="Status lifecycle, priority, assignees, email notifications, and Slack / Discord / GitHub / Linear integration — all tied to the original user feedback."
        />
        <div className="mt-8">
          <EditorialCard>
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
          </EditorialCard>
        </div>
      </div>
    );
  }

  const projectIds = (organization.projects ?? []).map((p) => p.id);

  const page = Math.max(1, parseInt(params.page || '1', 10));

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

  const [bugs, filteredCount, counts] = await Promise.all([
    prisma.bugTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: LIMIT,
      skip: (page - 1) * LIMIT,
      include: {
        response: {
          select: { mode: true, content: true, rating: true, vote: true },
        },
        project: { select: { name: true } },
      },
    }),
    prisma.bugTicket.count({ where }),
    prisma.bugTicket.groupBy({
      by: ['status'],
      where: { projectId: { in: projectIds } },
      _count: true,
    }),
  ]);
  const totalPages = Math.ceil(filteredCount / LIMIT);

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
      <EditorialPageHeader
        eyebrow={`${totalCount.toLocaleString()} total · ${activeCount} active`}
        title="Bugs"
        subtitle="Track and manage bug reports from user feedback."
        action={
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
        }
      />

      <div className="mb-6 flex items-center gap-1 border-b border-editorial-neutral-2">
        {tabs.map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/dashboard/bugs${tab.key !== 'active' ? `?status=${tab.key}` : ''}`}
              className={`relative inline-flex h-11 items-center gap-2 px-3 text-[14px] transition-colors duration-240 ease-page-turn ${
                active ? 'text-editorial-ink' : 'text-editorial-neutral-3 hover:text-editorial-ink'
              }`}
            >
              {tab.label}
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3">
                {tab.count}
              </span>
              {active && (
                <span
                  className="absolute inset-x-3 -bottom-px h-px bg-editorial-ink"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>

      {bugs.length === 0 ? (
        <EditorialCard>
          <EditorialEmptyState
            title="No bugs in this view"
            body="Bugs appear here when users flag feedback as bug reports — either via the SDK's bug flag or through a dedicated bug report button."
          />
        </EditorialCard>
      ) : (
        <EditorialCard className="overflow-hidden">
          <EditorialTable className="table-fixed">
            <colgroup>
              <col className="w-[38%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[11%]" />
              <col className="w-[12%]" />
              <col className="w-[13%]" />
            </colgroup>
            <EditorialTHead>
              <EditorialTR className="hover:bg-transparent">
                <EditorialTH>Title</EditorialTH>
                <EditorialTH>Element</EditorialTH>
                <EditorialTH>Status</EditorialTH>
                <EditorialTH>Priority</EditorialTH>
                <EditorialTH>Project</EditorialTH>
                <EditorialTH>Date</EditorialTH>
              </EditorialTR>
            </EditorialTHead>
            <EditorialTBody>
              {bugs.map((bug) => {
                const status = STATUS_CONFIG[bug.status] || STATUS_CONFIG.OPEN;
                const priority = PRIORITY_CONFIG[bug.priority] || PRIORITY_CONFIG.MEDIUM;

                return (
                  <EditorialTR key={bug.id}>
                    <EditorialTD>
                      <Link
                        href={`/dashboard/bugs/${bug.id}`}
                        className="line-clamp-1 text-[14px] text-editorial-ink transition-colors hover:text-editorial-accent"
                      >
                        {bug.title}
                      </Link>
                    </EditorialTD>
                    <EditorialTD>
                      <code className="block max-w-full truncate font-mono text-[11px] text-editorial-neutral-3">
                        {bug.elementId}
                      </code>
                    </EditorialTD>
                    <EditorialTD>
                      <span
                        className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${status.tone}`}
                      >
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                        {status.label}
                      </span>
                    </EditorialTD>
                    <EditorialTD>
                      <span
                        className={`font-mono text-[10px] uppercase tracking-[0.14em] ${priority.tone}`}
                      >
                        {priority.label}
                      </span>
                    </EditorialTD>
                    <EditorialTD>
                      <span className="text-[13px] text-editorial-neutral-3">
                        {bug.project.name}
                      </span>
                    </EditorialTD>
                    <EditorialTD>
                      <span className="whitespace-nowrap font-mono text-[12px] tabular-nums text-editorial-neutral-3">
                        {formatDate(bug.createdAt)}
                      </span>
                    </EditorialTD>
                  </EditorialTR>
                );
              })}
            </EditorialTBody>
          </EditorialTable>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            total={filteredCount}
            basePath="/dashboard/bugs"
            itemLabel="bugs"
          />
        </EditorialCard>
      )}
    </div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MS_DAY = 24 * 60 * 60 * 1000;

function formatDate(date: Date): string {
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const yesterday = now.getTime() - date.getTime() < 2 * MS_DAY && !sameDay;

  if (sameDay || yesterday) {
    let h = date.getHours();
    const min = date.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'p' : 'a';
    h = h % 12 || 12;
    return `${sameDay ? 'Today' : 'Yesterday'} ${h}:${min}${ampm}`;
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  const m = MONTHS[date.getMonth()];
  const d = date.getDate();
  return sameYear ? `${m} ${d}` : `${m} ${d}, ${date.getFullYear()}`;
}
