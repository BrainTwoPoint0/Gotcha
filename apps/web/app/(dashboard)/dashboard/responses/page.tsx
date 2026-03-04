import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { ResponsesFilter } from './responses-filter';
import { Pagination } from './pagination';
import { ExportButton } from './export-button';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  }>;
}

export default async function ResponsesPage({ searchParams }: PageProps) {
  const params = await searchParams;
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
                },
              },
            },
          },
        },
      })
    : null;

  const organization = dbUser?.memberships[0]?.organization;
  const subscription = organization?.subscription;
  const isPro = subscription?.plan === 'PRO';

  // Parse pagination
  const page = Math.max(1, parseInt(params.page || '1', 10));

  // Parse date filters
  const startDate = params.startDate ? new Date(params.startDate) : undefined;
  const endDate = params.endDate ? new Date(`${params.endDate}T23:59:59.999Z`) : undefined;

  // FREE users are limited to last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const effectiveStartDate = !isPro && !startDate ? thirtyDaysAgo : startDate;

  // Parse status filter
  const validStatuses = ['NEW', 'REVIEWED', 'ADDRESSED', 'ARCHIVED'] as const;
  type ResponseStatus = (typeof validStatuses)[number];
  const statusFilter = params.status
    ? (params.status.split(',').filter((s): s is ResponseStatus =>
        (validStatuses as readonly string[]).includes(s)
      ))
    : undefined;

  // Build where clause
  const where = {
    project: {
      organizationId: organization?.id,
    },
    ...(params.elementId && { elementIdRaw: params.elementId }),
    ...(statusFilter && statusFilter.length > 0 && { status: { in: statusFilter } }),
    ...(effectiveStartDate || endDate
      ? {
          createdAt: {
            ...(effectiveStartDate && { gte: effectiveStartDate }),
            ...(endDate && { lte: endDate }),
          },
        }
      : {}),
  };

  // Run all queries in parallel
  const [elements, total, gatedCount, responses] = organization
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
      ])
    : [[], 0, 0, [] as ResponseItem[]];

  const elementOptions = elements.map((e) => ({
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
            <h1 className="text-2xl font-bold text-gray-900">All Responses</h1>
            <DashboardFeedback
              elementId="responses-page"
              mode="poll"
              promptText="What would make this page more useful?"
              options={['Better filtering', 'Response tagging', 'Bulk actions', 'Search responses']}
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
          <p className="text-gray-600">View feedback from all your projects</p>
        </div>
        <ExportButton isPro={isPro} />
      </div>

      <ResponsesFilter elements={elementOptions} currentStatus={params.status} />

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
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No responses found</h3>
          <p className="mt-2 text-gray-500">
            {params.startDate || params.endDate || params.elementId
              ? 'Try adjusting your filters.'
              : 'Responses from your SDK integrations will appear here.'}
          </p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full">
              <colgroup>
                <col className="w-[60%] sm:w-[30%]" />
                <col className="hidden sm:table-column sm:w-[15%]" />
                <col className="hidden sm:table-column sm:w-[10%]" />
                <col className="w-[40%] sm:w-[10%]" />
                <col className="hidden md:table-column md:w-[20%]" />
                <col className="hidden sm:table-column sm:w-[15%]" />
              </colgroup>
              <TableHeader>
                <TableRow className="border-b border-gray-200/80">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Response</TableHead>
                  <TableHead className="hidden sm:table-cell text-xs font-medium uppercase tracking-wider text-gray-400">Project</TableHead>
                  <TableHead className="hidden sm:table-cell text-xs font-medium uppercase tracking-wider text-gray-400">Type</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Status</TableHead>
                  <TableHead className="hidden md:table-cell text-xs font-medium uppercase tracking-wider text-gray-400">Element</TableHead>
                  <TableHead className="hidden sm:table-cell text-xs font-medium uppercase tracking-wider text-gray-400">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeResponses.map((response) => (
                  <ResponseRow
                    key={response.id}
                    response={response}
                    isGated={!isPro && response.gated}
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
