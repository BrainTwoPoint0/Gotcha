import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization and subscription
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

    const organization = dbUser?.memberships[0]?.organization;
    const subscription = organization?.subscription;

    // Pro gate - also check organization exists
    if (!organization || subscription?.plan !== 'PRO') {
      return NextResponse.json(
        { error: 'Export is a Pro feature. Please upgrade to access.' },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where = {
      project: { organizationId: organization.id },
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(`${endDate}T23:59:59.999Z`) }),
            },
          }
        : {}),
    };

    // Fetch responses
    const responses = await prisma.response.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: { name: true, slug: true },
        },
      },
    });

    if (format === 'json') {
      // JSON export
      const data = responses.map((r) => ({
        id: r.id,
        project: r.project.name,
        mode: r.mode,
        content: r.content,
        title: r.title,
        rating: r.rating,
        vote: r.vote,
        element: r.elementIdRaw,
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
      'Type',
      'Content',
      'Title',
      'Rating',
      'Vote',
      'Element',
      'Date',
    ];
    const rows = responses.map((r) => [
      r.id,
      r.project.name,
      r.mode,
      escapeCsvField(r.content || ''),
      escapeCsvField(r.title || ''),
      r.rating?.toString() || '',
      r.vote || '',
      r.elementIdRaw,
      r.createdAt.toISOString(),
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

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
