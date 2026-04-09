import { prisma } from '@/lib/prisma';
import { getAuthUser, getActiveOrganization } from '@/lib/auth';
import { getAvailableTags } from '@/lib/analytics-queries';
import { ResponsesFilter } from './responses-filter';
import { Pagination } from '../../components/pagination';
import { ExportButton } from './export-button';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponseRow } from './response-row';

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

  // Parse pagination
  const page = Math.max(1, parseInt(params.page || '1', 10));

  // Parse date filters
  const startDate = params.startDate ? new Date(params.startDate) : undefined;
  const endDate = params.endDate ? new Date(`${params.endDate}T23:59:59.999Z`) : undefined;

  // FREE users are limited to last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const effectiveStartDate = !isPro && !startDate ? thirtyDaysAgo : startDate;

  // Parse status filter — defaults to excluding ARCHIVED
  const validStatuses = ['NEW', 'REVIEWED', 'ADDRESSED', 'ARCHIVED'] as const;
  const defaultStatuses = ['NEW', 'REVIEWED', 'ADDRESSED'] as const;
  type ResponseStatus = (typeof validStatuses)[number];
  const statusFilter = params.status
    ? params.status
        .split(',')
        .filter((s): s is ResponseStatus => (validStatuses as readonly string[]).includes(s))
    : [...defaultStatuses];

  // Build where clause
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

  // Run all queries in parallel
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

  // Redact gated responses server-side so real data never reaches the client
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">All Responses</h1>
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
          <p className="text-gray-600">View feedback from all your projects</p>
        </div>
        <ExportButton isPro={isPro} />
      </div>

      <ResponsesFilter
        elements={elementOptions}
        currentStatus={params.status}
        availableTags={availableTagOptions}
      />

      {gatedCount > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {gatedCount.toLocaleString()} response{gatedCount === 1 ? '' : 's'} beyond the free
            limit.{' '}
            <a href="/dashboard/settings" className="font-medium underline">
              Upgrade to Pro
            </a>{' '}
            to unlock all your data.
          </AlertDescription>
        </Alert>
      )}

      {!isPro && gatedCount === 0 && (
        <Alert className="mb-4">
          <AlertDescription>
            Showing responses from the last 30 days.{' '}
            <a href="/dashboard/settings" className="font-medium underline">
              Upgrade to Pro
            </a>{' '}
            to view all historical data.
          </AlertDescription>
        </Alert>
      )}

      {safeResponses.length === 0 ? (
        <Card className="text-center py-20">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No responses found</h3>
          <p className="mt-2 text-gray-500 max-w-sm mx-auto">
            {params.startDate || params.endDate || params.elementId
              ? 'Try adjusting your filters.'
              : 'Responses from your SDK integrations will appear here.'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="w-full min-w-[700px]">
              <TableHeader>
                <TableRow className="border-b border-gray-200/80">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Response
                  </TableHead>
                  <TableHead className="hidden sm:table-cell text-xs font-medium uppercase tracking-wider text-gray-400">
                    Project
                  </TableHead>
                  <TableHead className="hidden sm:table-cell text-xs font-medium uppercase tracking-wider text-gray-400">
                    Type
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Status
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-xs font-medium uppercase tracking-wider text-gray-400">
                    Element
                  </TableHead>
                  <TableHead className="hidden sm:table-cell text-xs font-medium uppercase tracking-wider text-gray-400">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeResponses.map((response) => (
                  <ResponseRow
                    key={response.id}
                    response={response}
                    isGated={!isPro && response.gated}
                    isPro={isPro}
                    availableTags={availableTagOptions}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} total={total} />
        </Card>
      )}
    </div>
  );
}
