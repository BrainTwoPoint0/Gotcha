import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

interface SegmentData {
  segment: string;
  count: number;
  avgRating: number | null;
  positiveVotes: number;
  negativeVotes: number;
  positiveRate: number | null;
}

async function getUserOrganization() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
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
  });

  return dbUser?.memberships[0]?.organization || null;
}

export async function GET(request: NextRequest) {
  try {
    const organization = await getUserOrganization();

    if (!organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is on Pro plan
    if (organization.subscription?.plan !== 'PRO') {
      return NextResponse.json({ error: 'Segmentation is a Pro feature' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const groupBy = searchParams.get('groupBy');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!groupBy) {
      return NextResponse.json({ error: 'groupBy parameter is required' }, { status: 400 });
    }

    // Build where clause
    const where: Record<string, unknown> = {
      project: {
        organizationId: organization.id,
        ...(projectId && { id: projectId }),
      },
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    // Get responses with endUserMeta (bounded for safety)
    const responses = await prisma.response.findMany({
      where,
      take: 100000,
      select: {
        rating: true,
        vote: true,
        endUserMeta: true,
      },
    });

    // Group by the specified field
    const segments: Record<string, { ratings: number[]; votes: { up: number; down: number } }> = {};

    responses.forEach((r) => {
      const meta = r.endUserMeta as Record<string, unknown>;
      const segmentValue = meta?.[groupBy];

      // Convert to string for grouping
      const segment =
        segmentValue !== undefined && segmentValue !== null ? String(segmentValue) : '(not set)';

      if (!segments[segment]) {
        segments[segment] = { ratings: [], votes: { up: 0, down: 0 } };
      }

      if (r.rating) {
        segments[segment].ratings.push(r.rating);
      }

      if (r.vote === 'UP') {
        segments[segment].votes.up++;
      } else if (r.vote === 'DOWN') {
        segments[segment].votes.down++;
      }
    });

    // Calculate stats for each segment
    const segmentData: SegmentData[] = Object.entries(segments).map(([segment, data]) => {
      const avgRating =
        data.ratings.length > 0
          ? Number((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(2))
          : null;

      const totalVotes = data.votes.up + data.votes.down;
      const positiveRate = totalVotes > 0 ? Math.round((data.votes.up / totalVotes) * 100) : null;

      return {
        segment,
        count: data.ratings.length + data.votes.up + data.votes.down,
        avgRating,
        positiveVotes: data.votes.up,
        negativeVotes: data.votes.down,
        positiveRate,
      };
    });

    // Sort by count (descending)
    segmentData.sort((a, b) => b.count - a.count);

    // Get available fields for this organization's projects
    const metadataFields = await prisma.metadataField.findMany({
      where: {
        project: {
          organizationId: organization.id,
          ...(projectId && { id: projectId }),
        },
        isActive: true,
      },
      select: {
        fieldKey: true,
        displayName: true,
        fieldType: true,
      },
      distinct: ['fieldKey'],
    });

    return NextResponse.json({
      groupBy,
      segments: segmentData,
      availableFields: metadataFields.map((f) => ({
        key: f.fieldKey,
        displayName: f.displayName || f.fieldKey,
        type: f.fieldType,
      })),
      totalResponses: responses.length,
    });
  } catch (error) {
    console.error('GET /api/analytics/segment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
