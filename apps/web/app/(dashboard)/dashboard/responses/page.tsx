import { prisma } from '@/lib/prisma';
import { getAuthUser, getActiveOrganization } from '@/lib/auth';
import { getAvailableTags } from '@/lib/analytics-queries';
import { ResponsesFilter } from './responses-filter';
import { Pagination } from '../../components/pagination';
import { ExportButton } from './export-button';
import { ResponseRow } from './response-row';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';
import {
  EditorialTable,
  EditorialTHead,
  EditorialTBody,
  EditorialTR,
  EditorialTH,
} from '../../components/editorial/table';
import { EditorialCard } from '../../components/editorial/card';
import { EditorialPageHeader } from '../../components/editorial/page-header';
import { EditorialEmptyState } from '../../components/editorial/empty-state';
import { EditorialLinkButton } from '../../components/editorial/button';

export const dynamic = 'force-dynamic';

const LIMIT = 20;

interface ResponseItem {
  id: string;
  mode: string;
  content: string | null;
  title: string | null;
  rating: number | null;
  vote: string | null;
  pollSelected: unknown;
  elementIdRaw: string;
  gated: boolean;
  status: string;
  tags: string[];
  createdAt: Date;
  project: { name: string; slug: string };
}

interface PageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    page?: string;
    elementId?: string;
    status?: string;
    tag?: string;
    search?: string;
  }>;
}

export default async function ResponsesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getAuthUser();

  const dbUser = user
    ? await prisma.user.findUnique({
        where: { email: user.email! },
      })
    : null;

  const activeOrg = user?.email ? await getActiveOrganization(user.email) : null;
  const organization = activeOrg?.organization;
  const isPro = activeOrg?.isPro ?? false;

  const page = Math.max(1, parseInt(params.page || '1', 10));

  const startDate = params.startDate ? new Date(params.startDate) : undefined;
  const endDate = params.endDate ? new Date(`${params.endDate}T23:59:59.999Z`) : undefined;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const effectiveStartDate = !isPro && !startDate ? thirtyDaysAgo : startDate;

  const validStatuses = ['NEW', 'REVIEWED', 'ADDRESSED', 'ARCHIVED'] as const;
  const defaultStatuses = ['NEW', 'REVIEWED', 'ADDRESSED'] as const;
  type ResponseStatus = (typeof validStatuses)[number];
  const statusFilter = params.status
    ? params.status
        .split(',')
        .filter((s): s is ResponseStatus => (validStatuses as readonly string[]).includes(s))
    : [...defaultStatuses];

  const searchTerm = params.search?.trim() || '';
  const where = {
    project: {
      organizationId: organization?.id,
    },
    ...(params.elementId && { elementIdRaw: params.elementId }),
    ...(params.tag && { tags: { has: params.tag.trim().toLowerCase() } }),
    ...(statusFilter.length > 0 && { status: { in: statusFilter } }),
    ...(effectiveStartDate || endDate
      ? {
          createdAt: {
            ...(effectiveStartDate && { gte: effectiveStartDate }),
            ...(endDate && { lte: endDate }),
          },
        }
      : {}),
    ...(searchTerm && {
      OR: [
        { content: { contains: searchTerm, mode: 'insensitive' as const } },
        { title: { contains: searchTerm, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [elements, total, gatedCount, responses, availableTags] = organization
    ? await Promise.all([
        prisma.response.groupBy({
          by: ['elementIdRaw'],
          where: {
            project: {
              organizationId: organization.id,
            },
          },
          _count: {
            elementIdRaw: true,
          },
          orderBy: {
            _count: {
              elementIdRaw: 'desc',
            },
          },
        }),
        prisma.response.count({ where }),
        !isPro ? prisma.response.count({ where: { ...where, gated: true } }) : Promise.resolve(0),
        prisma.response.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * LIMIT,
          take: LIMIT,
          include: {
            project: {
              select: { name: true, slug: true },
            },
          },
        }) as unknown as Promise<ResponseItem[]>,
        getAvailableTags(organization.id),
      ])
    : [[], 0, 0, [] as ResponseItem[], [] as { tag: string; count: bigint }[]];

  const availableTagOptions = availableTags.map((t) => ({
    tag: t.tag,
    count: Number(t.count),
  }));

  const archivedElementIds = organization?.archivedElementIds ?? [];

  const elementOptions = elements
    .filter((e) => !archivedElementIds.includes(e.elementIdRaw))
    .map((e) => ({
      elementIdRaw: e.elementIdRaw,
      count: e._count.elementIdRaw,
    }));

  const totalPages = Math.ceil(total / LIMIT);

  const safeResponses = responses.map((r) => {
    if (!isPro && r.gated) {
      return {
        ...r,
        content: 'Upgrade to view',
        title: null,
        rating: null,
        vote: null,
        pollSelected: null,
        elementIdRaw: '••••••',
        project: { name: '••••••', slug: r.project.slug },
      };
    }
    return r;
  });

  const hasActiveFilters = Boolean(
    params.startDate || params.endDate || params.elementId || params.search || params.tag
  );

  return (
    <div>
      <EditorialPageHeader
        eyebrow={`${total.toLocaleString()} total · all projects`}
        title="Responses"
        subtitle="Every piece of feedback from every project. Click a row to expand."
        action={<ExportButton isPro={isPro} />}
      />

      <ResponsesFilter
        elements={elementOptions}
        currentStatus={params.status}
        availableTags={availableTagOptions}
      />

      {(gatedCount > 0 || (!isPro && gatedCount === 0)) && (
        <div className="mb-6 rounded-md border-l-2 border-editorial-accent bg-editorial-accent/[0.04] px-5 py-4 text-[14px] text-editorial-ink">
          {gatedCount > 0 ? (
            <>
              <span className="font-medium">
                {gatedCount.toLocaleString()} response{gatedCount === 1 ? '' : 's'} beyond the free
                limit.
              </span>{' '}
              <a
                href="/dashboard/settings"
                className="underline decoration-editorial-accent decoration-1 underline-offset-4 hover:text-editorial-accent"
              >
                Upgrade to Pro
              </a>{' '}
              to unlock all your data.
            </>
          ) : (
            <>
              Showing responses from the last 30 days.{' '}
              <a
                href="/dashboard/settings"
                className="underline decoration-editorial-accent decoration-1 underline-offset-4 hover:text-editorial-accent"
              >
                Upgrade to Pro
              </a>{' '}
              to view all historical data.
            </>
          )}
        </div>
      )}

      {safeResponses.length === 0 ? (
        <EditorialCard>
          <EditorialEmptyState
            title={hasActiveFilters ? 'No responses match these filters' : 'Nothing yet'}
            body={
              hasActiveFilters
                ? 'Try widening your date range, clearing the status filter, or removing the tag.'
                : 'Once users start leaving feedback through your SDK, their responses will appear here — one row per submission.'
            }
            action={
              hasActiveFilters ? null : (
                <EditorialLinkButton href="/dashboard/projects" variant="ink">
                  Set up a project →
                </EditorialLinkButton>
              )
            }
          />
        </EditorialCard>
      ) : (
        <EditorialCard className="overflow-hidden">
          <EditorialTable className="min-w-[720px] table-fixed">
            <colgroup>
              <col className="w-[38%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
            </colgroup>
            <EditorialTHead>
              <EditorialTR className="hover:bg-transparent">
                <EditorialTH>Response</EditorialTH>
                <EditorialTH className="hidden sm:table-cell">Project</EditorialTH>
                <EditorialTH className="hidden sm:table-cell">Type</EditorialTH>
                <EditorialTH>Status</EditorialTH>
                <EditorialTH className="hidden md:table-cell">Element</EditorialTH>
                <EditorialTH className="hidden sm:table-cell">Date</EditorialTH>
              </EditorialTR>
            </EditorialTHead>
            <EditorialTBody>
              {safeResponses.map((response) => (
                <ResponseRow
                  key={response.id}
                  response={response}
                  isGated={!isPro && response.gated}
                  isPro={isPro}
                  availableTags={availableTagOptions}
                />
              ))}
            </EditorialTBody>
          </EditorialTable>
          <Pagination currentPage={page} totalPages={totalPages} total={total} />
        </EditorialCard>
      )}

      {/* Per-page feedback widget — quiet hint, not a chrome element */}
      <div className="mt-10 flex items-center justify-center gap-3 text-[13px] text-editorial-neutral-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Improve this page</span>
        <DashboardFeedback
          elementId="responses-page"
          mode="poll"
          promptText="What would make this page more useful?"
          options={[
            'Full-text search',
            'Bulk status changes',
            'Saved filter presets',
            'Response annotations',
            'Auto-categorization',
          ]}
          onePerUser={false}
          userEmail={dbUser?.email}
          userName={dbUser?.name ?? undefined}
          userProfile={{
            companySize: dbUser?.companySize ?? undefined,
            role: dbUser?.role ?? undefined,
            industry: dbUser?.industry ?? undefined,
            useCase: dbUser?.useCase ?? undefined,
            plan: isPro ? 'PRO' : 'FREE',
          }}
        />
      </div>
    </div>
  );
}
