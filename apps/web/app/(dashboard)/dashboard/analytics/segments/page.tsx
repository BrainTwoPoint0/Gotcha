import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';
import Link from 'next/link';
import { SegmentCharts } from './segment-charts';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';
import { calculateNPS } from '@/lib/nps';
import { parseDevice, parseBrowser } from '@/lib/ua-parser';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ projectId?: string; elementId?: string; groupBy?: string }>;
}

export default async function SegmentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dbUser = user
    ? await prisma.user.findUnique({
        where: { email: user.email! },
      })
    : null;

  const activeOrg = user?.email ? await getActiveOrganization(user.email) : null;
  const organization = activeOrg?.organization;
  const isPro = activeOrg?.isPro ?? false;

  // Pro gate
  if (!isPro || !organization) {
    return (
      <div>
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">User Segments</h1>
            <DashboardFeedback
              elementId="segments-gate"
              mode="poll"
              promptText="What would you use segmentation for?"
              options={[
                'Compare feedback by plan tier',
                'Analyze by user role',
                'Regional breakdown',
                'Compare team sizes',
              ]}
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
          <p className="text-gray-600">Analyze responses by user attributes</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unlock User Segmentation</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Upgrade to Pro to segment your feedback by user attributes like plan, location, age, and
            more.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-slate-700 hover:bg-slate-800"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  // Fetch projects for filter
  const projects = await prisma.project.findMany({
    where: { organizationId: organization.id },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });

  // Fetch unique elements for filter
  const elementsData = await prisma.response.groupBy({
    by: ['elementIdRaw'],
    where: {
      project: {
        organizationId: organization.id,
        ...(params.projectId && { id: params.projectId }),
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
  });

  const archivedElementIds = organization.archivedElementIds ?? [];

  const elements = elementsData
    .filter((e) => !archivedElementIds.includes(e.elementIdRaw))
    .map((e) => ({
      elementIdRaw: e.elementIdRaw,
      count: e._count.elementIdRaw,
    }));

  // Fetch available metadata fields
  const where: Record<string, unknown> = {
    project: {
      organizationId: organization.id,
    },
    isActive: true,
  };

  if (params.projectId) {
    where.project = {
      ...(where.project as object),
      id: params.projectId,
    };
  }

  const metadataFields = await prisma.metadataField.findMany({
    where,
    select: {
      fieldKey: true,
      displayName: true,
      fieldType: true,
    },
    distinct: ['fieldKey'],
  });

  // Discover fields from actual data if no configured fields
  let discoveredFields: { key: string; displayName: string }[] = [];
  if (metadataFields.length === 0) {
    const responseWhere: Record<string, unknown> = {
      project: {
        organizationId: organization.id,
        ...(params.projectId && { id: params.projectId }),
      },
      NOT: {
        endUserMeta: { equals: {} },
      },
    };

    const sampleResponses = await prisma.response.findMany({
      where: responseWhere,
      select: { endUserMeta: true },
      take: 100,
    });

    const fieldSet = new Set<string>();
    sampleResponses.forEach((r) => {
      const meta = r.endUserMeta as Record<string, unknown>;
      if (meta && typeof meta === 'object') {
        Object.keys(meta).forEach((key) => {
          if (key !== 'id') fieldSet.add(key);
        });
      }
    });

    discoveredFields = Array.from(fieldSet).map((key) => ({
      key,
      displayName: key,
    }));
  }

  const BUILTIN_FIELDS = [
    { key: '__url__', displayName: 'Page URL' },
    { key: '__device__', displayName: 'Device' },
    { key: '__browser__', displayName: 'Browser' },
  ];

  const userFields =
    metadataFields.length > 0
      ? metadataFields.map((f) => ({ key: f.fieldKey, displayName: f.displayName || f.fieldKey }))
      : discoveredFields;

  const availableFields = [...BUILTIN_FIELDS, ...userFields];

  const selectedGroupBy = params.groupBy || availableFields[0]?.key || '';

  // Get segment data
  let segmentData: Array<{
    segment: string;
    count: number;
    avgRating: number | null;
    positiveRate: number | null;
    npsScore: number | null;
  }> = [];
  let segmentDataCapped = false;

  if (selectedGroupBy) {
    const responseWhere: Record<string, unknown> = {
      project: {
        organizationId: organization.id,
        ...(params.projectId && { id: params.projectId }),
      },
      ...(params.elementId && { elementIdRaw: params.elementId }),
    };

    const SEGMENT_LIMIT = 10000;
    const responses = await prisma.response.findMany({
      where: responseWhere,
      select: {
        mode: true,
        rating: true,
        vote: true,
        endUserMeta: true,
        url: true,
        userAgent: true,
      },
      take: SEGMENT_LIMIT,
    });

    const extractSegmentValue = (
      r: (typeof responses)[0],
      groupByKey: string
    ): string => {
      if (groupByKey === '__url__') {
        try {
          return new URL(r.url || '').pathname;
        } catch {
          return r.url || '(not set)';
        }
      }
      if (groupByKey === '__device__') return parseDevice(r.userAgent);
      if (groupByKey === '__browser__') return parseBrowser(r.userAgent);
      const meta = r.endUserMeta as Record<string, unknown>;
      const val = meta?.[groupByKey];
      return val !== undefined && val !== null ? String(val) : '(not set)';
    };

    const segments: Record<
      string,
      { ratings: number[]; npsRatings: number[]; votes: { up: number; down: number } }
    > = {};

    responses.forEach((r) => {
      const segment = extractSegmentValue(r, selectedGroupBy);

      if (!segments[segment]) {
        segments[segment] = { ratings: [], npsRatings: [], votes: { up: 0, down: 0 } };
      }

      if (r.rating) {
        if (r.mode === 'NPS') {
          segments[segment].npsRatings.push(r.rating);
        } else {
          segments[segment].ratings.push(r.rating);
        }
      }

      if (r.vote === 'UP') {
        segments[segment].votes.up++;
      } else if (r.vote === 'DOWN') {
        segments[segment].votes.down++;
      }
    });

    segmentDataCapped = responses.length >= SEGMENT_LIMIT;

    segmentData = Object.entries(segments)
      .map(([segment, data]) => {
        const avgRating =
          data.ratings.length > 0
            ? Number((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(2))
            : null;

        const totalVotes = data.votes.up + data.votes.down;
        const positiveRate = totalVotes > 0 ? Math.round((data.votes.up / totalVotes) * 100) : null;

        const npsResult = data.npsRatings.length >= 3 ? calculateNPS(data.npsRatings) : null;

        return {
          segment,
          count: data.ratings.length + data.npsRatings.length + data.votes.up + data.votes.down,
          avgRating,
          positiveRate,
          npsScore: npsResult?.score ?? null,
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  const selectedProject = params.projectId ? projects.find((p) => p.id === params.projectId) : null;
  const selectedElement = params.elementId || null;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">User Segments</h1>
          <DashboardFeedback
            elementId="segments-page-pro"
            promptText="Rate the segmentation tools"
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
        <p className="text-gray-600">
          {selectedProject ? `${selectedProject.name}` : 'All projects'}
          {selectedElement ? ` / ${selectedElement}` : ''}
          {' - '}Grouped by {selectedGroupBy || 'none'}
        </p>
      </div>

      {segmentDataCapped && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <p className="text-sm text-yellow-700">
            Showing analysis based on the most recent 10,000 responses. Results may not reflect the
            full dataset.
          </p>
        </div>
      )}

      <SegmentCharts
        projects={projects}
        elements={elements}
        availableFields={availableFields}
        segmentData={segmentData}
        selectedProjectId={params.projectId}
        selectedElementId={params.elementId}
        selectedGroupBy={selectedGroupBy}
      />
    </div>
  );
}
