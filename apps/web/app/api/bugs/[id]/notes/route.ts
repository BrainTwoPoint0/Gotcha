import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';
import { sendBugUpdateEmail } from '@/lib/emails/send';
import { fireWebhooks } from '@/lib/webhooks';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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

    if (!isPro) {
      return NextResponse.json({ error: 'Bug tracking requires a Pro plan' }, { status: 403 });
    }

    const projectIds = (organization.projects || []).map((p) => p.id);

    // Verify bug belongs to org
    const bug = await prisma.bugTicket.findFirst({
      where: { id, projectId: { in: projectIds } },
      select: { id: true },
    });

    if (!bug) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    const notes = await prisma.bugNote.findMany({
      where: { bugTicketId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('GET /api/bugs/[id]/notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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

    const { organization, isPro, membership } = activeOrg;

    if (membership.role === 'VIEWER') {
      return NextResponse.json({ error: 'Viewers cannot add notes' }, { status: 403 });
    }

    if (!isPro) {
      return NextResponse.json({ error: 'Bug tracking requires a Pro plan' }, { status: 403 });
    }

    const projectIds = (organization.projects || []).map((p) => p.id);

    const bug = await prisma.bugTicket.findFirst({
      where: { id, projectId: { in: projectIds } },
    });

    if (!bug) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    // Parse body
    const body = await request.json();

    if (!body.content || typeof body.content !== 'string' || body.content.length > 5000) {
      return NextResponse.json(
        { error: 'Content is required and must be under 5000 characters' },
        { status: 400 }
      );
    }

    const isExternal = body.isExternal === true;

    // Get author name
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { name: true },
    });

    const note = await prisma.bugNote.create({
      data: {
        bugTicketId: id,
        authorEmail: user.email,
        authorName: dbUser?.name || null,
        content: body.content.trim(),
        isExternal,
      },
    });

    // Send email to reporter for external notes
    if (isExternal && bug.reporterEmail) {
      sendBugUpdateEmail({
        reporterEmail: bug.reporterEmail,
        reporterName: bug.reporterName,
        projectId: bug.projectId,
        bugTitle: bug.title,
        note: body.content.trim(),
        authorName: dbUser?.name || 'The team',
      }).catch(console.error);
    }

    // Fire webhook (non-blocking)
    fireWebhooks(bug.projectId, 'bug.updated', {
      ticketId: id,
      title: bug.title,
      elementId: bug.elementId,
      noteType: isExternal ? 'external' : 'internal',
      noteContent: body.content.trim(),
      authorEmail: user.email,
    }).catch(console.error);

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('POST /api/bugs/[id]/notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
