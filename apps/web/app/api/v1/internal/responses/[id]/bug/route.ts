import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';
import { isInternalOriginAllowed } from '@/lib/origin-check';
import { fireWebhooks } from '@/lib/webhooks';
import { sendBugReportEmail } from '@/lib/emails/send';

// Cache the API key lookup with 5-minute TTL
let cachedApiKey: { projectId: string; organizationId: string; plan: string } | null = null;
let cachedKeyHash: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getInternalApiKey() {
  const apiKeyString = process.env.GOTCHA_SDK_API;
  if (!apiKeyString) return null;

  const keyHash = createHash('sha256').update(apiKeyString).digest('hex');

  if (cachedApiKey && cachedKeyHash === keyHash && Date.now() - cachedAt < CACHE_TTL_MS)
    return cachedApiKey;

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      revokedAt: true,
      projectId: true,
      project: {
        select: {
          organizationId: true,
          organization: { select: { subscription: { select: { plan: true } } } },
        },
      },
    },
  });

  if (apiKey && apiKey.revokedAt === null) {
    const plan = apiKey.project.organization.subscription?.plan ?? 'FREE';
    const result = {
      projectId: apiKey.projectId,
      organizationId: apiKey.project.organizationId,
      plan,
    };
    cachedApiKey = result;
    cachedKeyHash = keyHash;
    cachedAt = Date.now();
    return result;
  }

  return null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: responseId } = await params;

    // UUID format validation
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(responseId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Invalid response ID format' } },
        { status: 400 }
      );
    }

    // Origin check (strict — requires browser context, rejects curl/server scripts)
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (!isInternalOriginAllowed(origin, host)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Cross-origin requests not allowed' } },
        { status: 403 }
      );
    }

    const apiKey = await getInternalApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'SDK not configured' } },
        { status: 500 }
      );
    }

    // Pro gate — bug flagging is a Pro feature
    if (apiKey.plan !== 'PRO') {
      return NextResponse.json(
        { error: { code: 'PLAN_REQUIRED', message: 'Bug tracking requires a Pro plan' } },
        { status: 403 }
      );
    }

    // Find the response
    const response = await prisma.response.findFirst({
      where: {
        id: responseId,
        projectId: apiKey.projectId,
      },
    });

    if (!response) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Response not found' } },
        { status: 404 }
      );
    }

    // Already flagged
    if (response.isBug) {
      const existingTicket = await prisma.bugTicket.findUnique({
        where: { responseId },
      });
      return NextResponse.json({ ticketId: existingTicket?.id, status: 'already_flagged' });
    }

    // Auto-generate title
    const title = response.content
      ? response.content.slice(0, 80) + (response.content.length > 80 ? '...' : '')
      : `Bug report from ${response.elementIdRaw}`;

    // Build description
    const descParts: string[] = [];
    if (response.content) descParts.push(response.content);
    if (response.url) descParts.push(`Page: ${response.url}`);
    if (response.userAgent) descParts.push(`Browser: ${response.userAgent}`);
    const description = descParts.join('\n\n') || 'No details provided';

    // Create ticket + mark response
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
            ((response.endUserMeta as Record<string, unknown>)?.email as string) ||
            (response.endUserId?.includes('@') ? response.endUserId : null),
          reporterName: ((response.endUserMeta as Record<string, unknown>)?.name as string) || null,
        },
      });

      await tx.response.update({
        where: { id: responseId },
        data: { isBug: true },
      });

      return bugTicket;
    });

    // Fire webhook (non-blocking, already Pro-gated by endpoint check above)
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

    return NextResponse.json({ ticketId: ticket.id, status: 'created' }, { status: 201 });
  } catch (error) {
    console.error(
      'POST /api/v1/internal/responses/[id]/bug error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
