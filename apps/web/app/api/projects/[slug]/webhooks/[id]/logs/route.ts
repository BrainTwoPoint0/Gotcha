import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        memberships: {
          include: {
            organization: {
              include: { subscription: true },
            },
          },
        },
      },
    });

    const organization = dbUser?.memberships[0]?.organization;
    if (!organization || organization.subscription?.plan !== 'PRO') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await prisma.project.findFirst({
      where: { slug, organizationId: organization.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify webhook belongs to this project
    const webhook = await prisma.webhook.findFirst({
      where: { id, projectId: project.id },
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '20'), 50);

    const [logs, total] = await Promise.all([
      prisma.webhookLog.findMany({
        where: { webhookId: id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.webhookLog.count({ where: { webhookId: id } }),
    ]);

    return NextResponse.json({
      logs,
      pagination: { page, limit, total, hasMore: page * limit < total },
    });
  } catch (error) {
    console.error('GET /api/projects/[slug]/webhooks/[id]/logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
