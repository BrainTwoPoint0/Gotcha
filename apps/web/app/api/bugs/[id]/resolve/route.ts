import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';
import { fireWebhooks } from '@/lib/webhooks';
import { sendBugResolutionEmail } from '@/lib/emails/send';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    const projectIds = (organization.projects || []).map((p) => p.id);

    // Find bug
    const bug = await prisma.bugTicket.findFirst({
      where: { id, projectId: { in: projectIds } },
    });

    if (!bug) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    // Parse body
    let resolutionNote: string | undefined;
    let reporterMessage: string | undefined;
    try {
      const body = await request.json();
      resolutionNote = body.resolutionNote;
      reporterMessage = body.reporterMessage;
    } catch {
      // No body is fine
    }

    // Resolve
    const updated = await prisma.bugTicket.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: dbUser!.id,
        ...(resolutionNote ? { resolutionNote } : {}),
      },
    });

    // Fire webhook (non-blocking)
    fireWebhooks(bug.projectId, 'bug.resolved', {
      ticketId: id,
      responseId: bug.responseId,
      elementId: bug.elementId,
      title: bug.title,
      resolutionNote: resolutionNote || null,
      resolvedAt: updated.resolvedAt?.toISOString(),
    }).catch(console.error);

    // Send resolution email to reporter (non-blocking)
    if (reporterMessage && bug.reporterEmail) {
      sendBugResolutionEmail({
        reporterEmail: bug.reporterEmail,
        reporterName: bug.reporterName,
        projectId: bug.projectId,
        bugTitle: bug.title,
        message: reporterMessage,
      }).catch(console.error);
    }

    return NextResponse.json({ bug: updated });
  } catch (error) {
    console.error('POST /api/bugs/[id]/resolve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
