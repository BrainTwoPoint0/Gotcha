import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { escapeCsvField } from '@/lib/csv-escape';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeOrg = await getActiveOrganization(user.email);
    if (!activeOrg || !activeOrg.isPro) {
      return NextResponse.json(
        { error: 'Export is a Pro feature. Please upgrade to access.' },
        { status: 403 }
      );
    }

    const { organization } = activeOrg;

    // Parse query params
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const elementId = searchParams.get('elementId');
    const status = searchParams.get('status');
    const tag = searchParams.get('tag');
    const mode = searchParams.get('mode');
    const projectId = searchParams.get('projectId');

    // Validate date formats
    const isValidDate = (d: string) => !isNaN(new Date(d).getTime());
    if (startDate && !isValidDate(startDate)) {
      return NextResponse.json({ error: 'Invalid startDate format' }, { status: 400 });
    }
    if (endDate && !isValidDate(endDate)) {
      return NextResponse.json({ error: 'Invalid endDate format' }, { status: 400 });
    }

    // Build where clause
    const where: Record<string, unknown> = {
      project: {
        organizationId: organization.id,
        ...(projectId ? { id: projectId } : {}),
      },
    };

    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(`${endDate}T23:59:59.999Z`) }),
      };
    }

    if (elementId) {
      where.elementIdRaw = elementId;
    }

    if (status) {
      const statuses = status.split(',').filter(Boolean);
      if (statuses.length > 0) {
        where.status = { in: statuses };
      }
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (mode) {
      where.mode = mode.toUpperCase();
    }

    // Fetch responses
    const responses = await prisma.response.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50000,
      include: {
        project: {
          select: { name: true, slug: true },
        },
      },
    });

    if (format === 'json') {
      const data = responses.map((r) => ({
        id: r.id,
        project: r.project.name,
        projectSlug: r.project.slug,
        element: r.elementIdRaw,
        mode: r.mode,
        content: r.content,
        title: r.title,
        rating: r.rating,
        vote: r.vote,
        pollSelected: r.pollSelected,
        status: r.status,
        tags: r.tags,
        isBug: r.isBug,
        userId: r.endUserId,
        userMeta: r.endUserMeta,
        url: r.url,
        createdAt: r.createdAt.toISOString(),
      }));

      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="gotcha-responses-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // CSV export
    const headers = [
      'ID',
      'Project',
      'Element',
      'Mode',
      'Content',
      'Title',
      'Rating',
      'Vote',
      'Poll Selected',
      'Status',
      'Tags',
      'Is Bug',
      'User ID',
      'User Meta',
      'URL',
      'Date',
    ];
    const rows = responses.map((r) => [
      escapeCsvField(r.id),
      escapeCsvField(r.project.name),
      escapeCsvField(r.elementIdRaw),
      escapeCsvField(r.mode),
      escapeCsvField(r.content || ''),
      escapeCsvField(r.title || ''),
      escapeCsvField(r.rating?.toString() || ''),
      escapeCsvField(r.vote || ''),
      escapeCsvField(
        Array.isArray(r.pollSelected) ? r.pollSelected.join('; ') : ''
      ),
      escapeCsvField(r.status),
      escapeCsvField(r.tags.join('; ')),
      escapeCsvField(r.isBug ? 'Yes' : ''),
      escapeCsvField(r.endUserId || ''),
      escapeCsvField(
        r.endUserMeta && typeof r.endUserMeta === 'object' && Object.keys(r.endUserMeta).length > 0
          ? JSON.stringify(r.endUserMeta)
          : ''
      ),
      escapeCsvField(r.url || ''),
      escapeCsvField(r.createdAt.toISOString()),
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="gotcha-responses-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
