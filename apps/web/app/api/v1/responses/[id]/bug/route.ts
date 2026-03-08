import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, apiError, apiSuccess, corsHeaders } from '@/lib/api-auth';
import { fireWebhooks } from '@/lib/webhooks';
import { sendBugReportEmail } from '@/lib/emails/send';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: responseId } = await params;

    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return apiError(authResult.error.code, authResult.error.message, authResult.error.status);
    }

    const { apiKey } = authResult;

    // Pro gate — bug flagging is a Pro feature
    if (apiKey.plan !== 'PRO') {
      return apiError(
        'PLAN_REQUIRED',
        'Bug tracking requires a Pro plan. Upgrade at https://gotcha.wtf/dashboard/settings',
        403
      );
    }

    // Find the response (must belong to this project)
    const response = await prisma.response.findFirst({
      where: {
        id: responseId,
        projectId: apiKey.projectId,
      },
    });

    if (!response) {
      return apiError('NOT_FOUND', 'Response not found', 404);
    }

    // Check if already flagged
    if (response.isBug) {
      const existingTicket = await prisma.bugTicket.findUnique({
        where: { responseId },
      });
      return Response.json(
        { ticketId: existingTicket?.id, status: 'already_flagged' },
        { headers: corsHeaders }
      );
    }

    // Auto-generate title from content
    const title = response.content
      ? response.content.slice(0, 80) + (response.content.length > 80 ? '...' : '')
      : `Bug report from ${response.elementIdRaw}`;

    // Build description with context
    const descParts: string[] = [];
    if (response.content) descParts.push(response.content);
    if (response.url) descParts.push(`Page: ${response.url}`);
    if (response.userAgent) descParts.push(`Browser: ${response.userAgent}`);
    const description = descParts.join('\n\n') || 'No details provided';

    // Create ticket + mark response in a transaction
    const ticket = await prisma.$transaction(async (tx) => {
      const bugTicket = await tx.bugTicket.create({
        data: {
          projectId: apiKey.projectId,
          responseId,
          title,
          description,
          elementId: response.elementIdRaw,
          pageUrl: response.url,
          userAgent: response.userAgent,
          endUserMeta: response.endUserMeta as object,
          endUserId: response.endUserId,
          reporterEmail:
            ((response.endUserMeta as Record<string, unknown>)?.email as string)
            || (response.endUserId?.includes('@') ? response.endUserId : null),
          reporterName: ((response.endUserMeta as Record<string, unknown>)?.name as string) || null,
        },
      });

      await tx.response.update({
        where: { id: responseId },
        data: { isBug: true },
      });

      return bugTicket;
    });

    // Fire webhook (non-blocking)
    fireWebhooks(apiKey.projectId, 'bug.created', {
      ticketId: ticket.id,
      responseId,
      elementId: response.elementIdRaw,
      title,
      status: 'OPEN',
      priority: 'MEDIUM',
      pageUrl: response.url,
      createdAt: ticket.createdAt.toISOString(),
    }).catch(console.error);

    // Send bug report email (non-blocking, already Pro-gated by endpoint check above)
    sendBugReportEmail(apiKey.organizationId, {
      id: ticket.id,
      title,
      description,
      elementId: response.elementIdRaw,
      pageUrl: response.url || null,
      projectId: apiKey.projectId,
    }).catch(console.error);

    return Response.json(
      { ticketId: ticket.id, status: 'created' },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error('POST /api/v1/responses/[id]/bug error:', error);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
