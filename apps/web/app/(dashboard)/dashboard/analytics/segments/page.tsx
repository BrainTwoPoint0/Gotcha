import { prisma } from '@/lib/prisma';
import { getAuthUser, getActiveOrganization } from '@/lib/auth';
import { SegmentCharts } from './segment-charts';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';
import { calculateNPS } from '@/lib/nps';
import { parseDevice, parseBrowser } from '@/lib/ua-parser';
import { EditorialPageHeader } from '../../../components/editorial/page-header';
import { ProGateOverlay } from '../../../components/editorial/pro-gate-overlay';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ projectId?: string; elementId?: string; groupBy?: string }>;
}

export default async function SegmentsPage({ searchParams }: PageProps) {
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

  // Pro gate
  if (!isPro || !organization) {
    return (
      <div>
        <EditorialPageHeader
          title="User segments"
          subtitle="Analyze responses by user attributes."
          action={
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
          }
        />
        <ProGateOverlay
          eyebrow="Pro · Segments"
          title="Compare feedback by user attribute"
          body="Slice responses by plan, role, region, company size, or any custom metadata field you send with submissions."
        />
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

    const extractSegmentValue = (r: (typeof responses)[0], groupByKey: string): string => {
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
      <EditorialPageHeader
        eyebrow={
          <>
            {selectedProject ? selectedProject.name : 'All projects'}
            {selectedElement ? ` / ${selectedElement}` : ''}
            {' · '}Grouped by {selectedGroupBy || 'none'}
          </>
        }
        title="User segments"
        subtitle="Compare responses across plan, role, region, and custom metadata."
        action={
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
        }
      />

      {segmentDataCapped && (
        <div className="mb-6 flex items-center gap-3 border-t border-editorial-neutral-2 pt-4 text-[13px] text-editorial-neutral-3">
          <span className="h-1 w-1 shrink-0 rounded-full bg-editorial-accent" aria-hidden="true" />
          <span>
            Showing analysis based on the most recent 10,000 responses. Results may not reflect the
            full dataset.
          </span>
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
