import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeOrg = await getActiveOrganization(user.email);
    if (!activeOrg) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization, isPro } = activeOrg;

    // Pro gate
    if (!isPro) {
      return NextResponse.json(
        { error: 'Bug tracking requires a Pro plan' },
        { status: 403 }
      );
    }

    const projectIds = (organization.projects || []).map((p) => p.id);

    // Parse filters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const elementId = searchParams.get('elementId');
    const projectId = searchParams.get('projectId');

    // Build where clause
    const where: Record<string, unknown> = {
      projectId: { in: projectIds },
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (elementId) where.elementId = elementId;
    if (projectId && projectIds.includes(projectId)) where.projectId = projectId;

    const bugs = await prisma.bugTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        response: {
          select: {
            mode: true,
            content: true,
            rating: true,
            vote: true,
            endUserId: true,
            endUserMeta: true,
            createdAt: true,
          },
        },
        project: {
          select: { name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ bugs });
  } catch (error) {
    console.error('GET /api/bugs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
