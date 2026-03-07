import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, apiError, apiSuccess, corsHeaders } from '@/lib/api-auth';
import {
  checkRateLimit,
  checkIdempotency,
  cacheIdempotencyResponse,
  type PlanType,
} from '@/lib/rate-limit';
import { submitResponseSchema, listResponsesSchema } from '@/lib/validations';
import { sendUsageWarningEmail, sendBugReportEmail } from '@/lib/emails/send';
import { shouldShowUpgradeWarning, isOverLimit } from '@/lib/plan-limits';
import { atomicIncrementUsage } from '@/lib/usage-atomic';
import { fireWebhooks } from '@/lib/webhooks';

// Define types locally instead of importing Prisma enums
type ResponseMode = 'FEEDBACK' | 'VOTE' | 'POLL' | 'FEATURE_REQUEST' | 'AB' | 'NPS';
type VoteType = 'UP' | 'DOWN';

// Map SDK mode strings to Prisma enums
const modeMap: Record<string, ResponseMode> = {
  feedback: 'FEEDBACK',
  vote: 'VOTE',
  poll: 'POLL',
  'feature-request': 'FEATURE_REQUEST',
  ab: 'AB',
  nps: 'NPS',
};

const voteMap: Record<string, VoteType> = {
  up: 'UP',
  down: 'DOWN',
};

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return apiError(authResult.error.code, authResult.error.message, authResult.error.status);
    }

    const { apiKey } = authResult;

    // Parse body and check rate limit + idempotency in parallel
    const idempotencyKey = request.headers.get('idempotency-key');
    const planKey = apiKey.plan.toLowerCase() as PlanType;

    const [body, rateLimit, idempotencyResult] = await Promise.all([
      request.json(),
      checkRateLimit(apiKey.id, planKey),
      idempotencyKey ? checkIdempotency(idempotencyKey) : Promise.resolve(null),
    ]);

    if (!rateLimit.success) {
      return apiError('RATE_LIMITED', 'Too many requests', 429);
    }

    if (idempotencyResult?.isDuplicate && idempotencyResult.cachedResponse) {
      const cached = JSON.parse(idempotencyResult.cachedResponse);
      return Response.json(
        { ...cached, status: 'duplicate' },
        {
          status: 201,
          headers: { ...corsHeaders, ...rateLimit.headers },
        }
      );
    }

    // Validate request body
    const validation = submitResponseSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues?.[0];
      return apiError('INVALID_REQUEST', firstError?.message || 'Invalid request body', 400);
    }

    const data = validation.data as typeof validation.data & {
      experimentId?: string;
      variant?: string;
    };

    // Generate response ID and timestamp up front so we can respond immediately
    const responseId = crypto.randomUUID();
    const createdAt = new Date();

    const result = {
      id: responseId,
      status: 'created' as const,
      createdAt: createdAt.toISOString(),
    };

    // Cache idempotency response early (fire-and-forget)
    if (idempotencyKey) {
      cacheIdempotencyResponse(idempotencyKey, JSON.stringify(result)).catch(() => {});
    }

    // DB writes (element lookup, response creation, usage tracking)
    const asyncWrite = async () => {
      try {
        // Get or create element (upsert to avoid race conditions)
        const element = await prisma.element.upsert({
          where: {
            projectId_elementId: {
              projectId: apiKey.projectId,
              elementId: data.elementId,
            },
          },
          update: {},
          create: {
            projectId: apiKey.projectId,
            elementId: data.elementId,
          },
        });
        const elementDbId = element.id;

        // Atomically reset (if new month) and increment usage counter
        await atomicIncrementUsage(apiKey.organizationId);

        // Check if this response exceeds the free limit
        let gated = false;
        if (apiKey.plan === 'FREE') {
          const subscription = await prisma.subscription.findUnique({
            where: { organizationId: apiKey.organizationId },
          });

          if (subscription) {
            gated = isOverLimit('FREE', subscription.responsesThisMonth);

            if (shouldShowUpgradeWarning('FREE', subscription.responsesThisMonth)) {
              const threshold = subscription.responsesThisMonth;
              if (threshold === 400 || threshold === 450 || threshold === 500) {
                sendUsageWarningEmail(apiKey.organizationId, threshold, 500).catch(console.error);
              }
            }
          }
        }

        // Create response (marked as gated if over limit)
        await prisma.response.create({
          data: {
            id: responseId,
            projectId: apiKey.projectId,
            elementId: elementDbId,
            elementIdRaw: data.elementId,
            mode: modeMap[data.mode],
            content: data.content,
            title: data.title,
            rating: data.rating,
            vote: data.vote ? voteMap[data.vote] : null,
            pollOptions: data.pollOptions,
            pollSelected: data.pollSelected,
            experimentId: data.experimentId,
            variant: data.variant,
            endUserId: data.user?.id,
            endUserMeta: (data.user || {}) as object,
            url: data.context?.url,
            userAgent: data.context?.userAgent,
            idempotencyKey: idempotencyKey,
            createdAt: createdAt,
            gated,
            isBug: data.isBug || false,
          },
        });

        // If flagged as bug, create a BugTicket
        if (data.isBug) {
          const bugTitle = data.content
            ? data.content.slice(0, 80) + (data.content.length > 80 ? '...' : '')
            : `Bug report from ${data.elementId}`;
          const descParts: string[] = [];
          if (data.content) descParts.push(data.content);
          if (data.context?.url) descParts.push(`Page: ${data.context.url}`);
          if (data.context?.userAgent) descParts.push(`Browser: ${data.context.userAgent}`);

          const bugDescription = descParts.join('\n\n') || 'No details provided';
          const bugTicket = await prisma.bugTicket.create({
            data: {
              projectId: apiKey.projectId,
              responseId,
              title: bugTitle,
              description: bugDescription,
              elementId: data.elementId,
              pageUrl: data.context?.url,
              userAgent: data.context?.userAgent,
              endUserMeta: (data.user || {}) as object,
              endUserId: data.user?.id,
              reporterEmail: typeof data.user?.email === 'string' ? data.user.email : null,
              reporterName: typeof data.user?.name === 'string' ? data.user.name : null,
            },
          });

          // Send bug report email (PRO only, non-blocking)
          if (apiKey.plan === 'PRO') {
            sendBugReportEmail(apiKey.organizationId, {
              id: bugTicket.id,
              title: bugTitle,
              description: bugDescription,
              elementId: data.elementId,
              pageUrl: data.context?.url || null,
              projectId: apiKey.projectId,
            }).catch(console.error);
          }
        }
      } catch (err) {
        console.error('Async DB write failed for response:', responseId, err);
      }
    };

    // Await DB writes to ensure they complete on serverless (Netlify)
    await asyncWrite();

    // Fire webhooks for PRO orgs (non-blocking)
    if (apiKey.plan === 'PRO') {
      fireWebhooks(apiKey.projectId, 'response.created', {
        id: responseId,
        elementId: data.elementId,
        mode: data.mode,
        content: data.content,
        rating: data.rating,
        vote: data.vote,
        isBug: data.isBug || false,
        createdAt: createdAt.toISOString(),
      }).catch(console.error);

      if (data.isBug) {
        fireWebhooks(apiKey.projectId, 'bug.created', {
          responseId,
          elementId: data.elementId,
          title: data.content
            ? data.content.slice(0, 80) + (data.content.length > 80 ? '...' : '')
            : `Bug report from ${data.elementId}`,
          status: 'OPEN',
          priority: 'MEDIUM',
          pageUrl: data.context?.url,
          createdAt: createdAt.toISOString(),
        }).catch(console.error);
      }
    }

    return Response.json(result, {
      status: 201,
      headers: { ...corsHeaders, ...rateLimit.headers },
    });
  } catch (error) {
    console.error('POST /api/v1/responses error:', error);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return apiError(authResult.error.code, authResult.error.message, authResult.error.status);
    }

    const { apiKey } = authResult;

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const params = {
      elementId: searchParams.get('elementId') || undefined,
      mode: searchParams.get('mode') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    };

    // Validate query params
    const validation = listResponsesSchema.safeParse(params);
    if (!validation.success) {
      const firstError = validation.error.issues?.[0];
      return apiError('INVALID_REQUEST', firstError?.message || 'Invalid query parameters', 400);
    }

    const { elementId, mode, startDate, endDate, page, limit } = validation.data;

    // Build where clause
    const where: Record<string, unknown> = {
      projectId: apiKey.projectId,
    };

    if (elementId) {
      where.elementIdRaw = elementId;
    }

    if (mode) {
      where.mode = modeMap[mode];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await prisma.response.count({ where });

    // Get responses
    const responses = await prisma.response.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        elementIdRaw: true,
        mode: true,
        content: true,
        title: true,
        rating: true,
        vote: true,
        pollOptions: true,
        pollSelected: true,
        experimentId: true,
        variant: true,
        endUserId: true,
        endUserMeta: true,
        createdAt: true,
      },
    });

    // Transform responses
    const data = responses.map((r: (typeof responses)[number]) => ({
      id: r.id,
      elementId: r.elementIdRaw,
      mode: Object.keys(modeMap).find((k) => modeMap[k] === r.mode) || r.mode.toLowerCase(),
      content: r.content,
      title: r.title,
      rating: r.rating,
      vote: r.vote ? r.vote.toLowerCase() : null,
      pollOptions: r.pollOptions,
      pollSelected: r.pollSelected,
      experimentId: r.experimentId,
      variant: r.variant,
      user: r.endUserId
        ? { id: r.endUserId, ...(r.endUserMeta as Record<string, unknown>) }
        : r.endUserMeta,
      createdAt: r.createdAt.toISOString(),
    }));

    return Response.json(
      {
        data,
        pagination: {
          page,
          limit,
          total,
          hasMore: page * limit < total,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('GET /api/v1/responses error:', error);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
