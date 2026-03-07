import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';

const VALID_STATUSES = ['OPEN', 'INVESTIGATING', 'FIXING', 'RESOLVED', 'CLOSED', 'WONT_FIX'] as const;
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

async function getAuthOrg() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const activeOrg = await getActiveOrganization(user.email);
  if (!activeOrg) return null;

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  });

  if (!dbUser) return null;

  return { userId: dbUser.id, organization: activeOrg.organization, isPro: activeOrg.isPro };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthOrg();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!auth.isPro) {
      return NextResponse.json({ error: 'Bug tracking requires a Pro plan' }, { status: 403 });
    }

    const projectIds = (auth.organization.projects || []).map((p) => p.id);

    const bug = await prisma.bugTicket.findFirst({
      where: { id, projectId: { in: projectIds } },
      include: {
        response: {
          select: {
            id: true,
            mode: true,
            content: true,
            rating: true,
            vote: true,
            endUserId: true,
            endUserMeta: true,
            url: true,
            userAgent: true,
            createdAt: true,
          },
        },
        project: { select: { name: true, slug: true } },
      },
    });

    if (!bug) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    return NextResponse.json({ bug });
  } catch (error) {
    console.error('GET /api/bugs/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthOrg();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!auth.isPro) {
      return NextResponse.json({ error: 'Bug tracking requires a Pro plan' }, { status: 403 });
    }

    const projectIds = (auth.organization.projects || []).map((p) => p.id);

    // Verify bug belongs to org
    const existing = await prisma.bugTicket.findFirst({
      where: { id, projectId: { in: projectIds } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.status) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (body.priority) {
      if (!VALID_PRIORITIES.includes(body.priority)) {
        return NextResponse.json(
          { error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` },
          { status: 400 }
        );
      }
      updates.priority = body.priority;
    }

    if (body.resolutionNote !== undefined) {
      updates.resolutionNote = body.resolutionNote;
    }

    const updated = await prisma.bugTicket.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ bug: updated });
  } catch (error) {
    console.error('PATCH /api/bugs/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
