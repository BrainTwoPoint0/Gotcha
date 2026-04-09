import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, apiError, apiSuccess, corsHeaders, getCorsHeaders } from '@/lib/api-auth';
import {
  checkRateLimit,
  checkIdempotency,
  cacheIdempotencyResponse,
  checkReadRateLimit,
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
  const reqOrigin = request.headers.get('origin');
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return apiError(
        authResult.error.code,
        authResult.error.message,
        authResult.error.status,
        reqOrigin
      );
    }

    const { apiKey } = authResult;

    // Parse body first (can fail with invalid JSON)
    const idempotencyKey = request.headers.get('idempotency-key');
    const planKey = apiKey.plan.toLowerCase() as PlanType;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError('INVALID_REQUEST', 'Invalid JSON body', 400, reqOrigin);
    }

    // Check rate limit + idempotency in parallel
    const [rateLimit, idempotencyResult] = await Promise.all([
      checkRateLimit(apiKey.id, planKey),
      idempotencyKey ? checkIdempotency(idempotencyKey, apiKey.id) : Promise.resolve(null),
    ]);

    if (!rateLimit.success) {
      return apiError('RATE_LIMITED', 'Too many requests', 429, reqOrigin);
    }

    if (idempotencyResult?.isDuplicate) {
      if (idempotencyResult.cachedResponse) {
        try {
          const cached = JSON.parse(idempotencyResult.cachedResponse);
          return Response.json(
            { ...cached, status: 'duplicate' },
            {
              status: 201,
              headers: { ...getCorsHeaders(reqOrigin), ...rateLimit.headers },
            }
          );
        } catch {
          // Corrupt cache entry — fall through and reprocess
        }
      }
      // Concurrent request in flight — no cached response yet
      return apiError('CONFLICT', 'Duplicate request in progress', 409, reqOrigin);
    }

    // Validate request body
    const validation = submitResponseSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues?.[0];
      return apiError(
        'INVALID_REQUEST',
        firstError?.message || 'Invalid request body',
        400,
        reqOrigin
      );
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

    // DB writes (element lookup, response creation, usage tracking)
    // No inner try/catch — errors propagate to the outer catch which returns 500
    const asyncWrite = async () => {
      // Element upsert + usage increment are independent — run in parallel
      const [element, _usage] = await Promise.all([
        prisma.element.upsert({
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
        }),
        atomicIncrementUsage(apiKey.organizationId),
      ]);
      const elementDbId = element.id;

      // Check if this response exceeds the free limit
      let gated = false;
      if (apiKey.plan === 'FREE') {
        const subscription = await prisma.subscription.findUnique({
          where: { organizationId: apiKey.organizationId },
        });

        if (subscription) {
          gated = isOverLimit('FREE', subscription.responsesThisMonth);

          if (shouldShowUpgradeWarning('FREE', subscription.responsesThisMonth)) {
            const count = subscription.responsesThisMonth;
            // Range-based: even if counter skips exact thresholds under concurrency
            if (
              (count >= 400 && count < 450) ||
              (count >= 450 && count < 500) ||
              (count >= 500 && count < 550)
            ) {
              const threshold = count >= 500 ? 500 : count >= 450 ? 450 : 400;
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
          contextMeta: data.context ? {
            viewport: data.context.viewport,
            language: data.context.language,
            timezone: data.context.timezone,
            screenResolution: data.context.screenResolution,
            recentErrors: data.context.recentErrors,
          } : undefined,
          idempotencyKey: idempotencyKey,
          createdAt: createdAt,
          gated,
          isBug: data.isBug || false,
        },
      });

      // Cache idempotency response after DB write succeeds (fire-and-forget)
      if (idempotencyKey) {
        cacheIdempotencyResponse(idempotencyKey, apiKey.id, JSON.stringify(result)).catch(() => {});
      }

      // If flagged as bug, create a BugTicket (fire-and-forget — don't block the response)
      if (data.isBug) {
        const bugTitle = data.content
          ? data.content.slice(0, 80) + (data.content.length > 80 ? '...' : '')
          : `Bug report from ${data.elementId}`;
        const descParts: string[] = [];
        if (data.content) descParts.push(data.content);
        if (data.context?.url) descParts.push(`Page: ${data.context.url}`);
        if (data.context?.userAgent) descParts.push(`Browser: ${data.context.userAgent}`);
        if (data.context?.viewport) descParts.push(`Viewport: ${data.context.viewport.width}x${data.context.viewport.height}`);
        if (data.context?.timezone) descParts.push(`Timezone: ${data.context.timezone}`);
        if (data.context?.recentErrors?.length) {
          const errorList = data.context.recentErrors
            .slice(0, 5)
            .map(e => `- ${e.message}${e.source ? ` (${e.source})` : ''}`)
            .join('\n');
          descParts.push(`Recent Errors:\n${errorList}`);
        }

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
            reporterEmail:
              typeof data.user?.email === 'string'
                ? data.user.email
                : typeof data.user?.id === 'string' && data.user.id.includes('@')
                  ? data.user.id
                  : null,
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
    };

    // Await DB writes to ensure they complete before Lambda freezes
    await asyncWrite();

    // Fire webhooks for PRO orgs (non-blocking, OK to lose on Lambda freeze)
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
      headers: { ...getCorsHeaders(reqOrigin), ...rateLimit.headers },
    });
  } catch (error) {
    console.error(
      'POST /api/v1/responses error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500, reqOrigin);
  }
}

export async function GET(request: NextRequest) {
  const reqOrigin = request.headers.get('origin');
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return apiError(
        authResult.error.code,
        authResult.error.message,
        authResult.error.status,
        reqOrigin
      );
    }

    const { apiKey } = authResult;

    const planKey = apiKey.plan.toLowerCase() as PlanType;
    const { success: readLimitOk } = await checkReadRateLimit(apiKey.id, planKey);
    if (!readLimitOk) {
      return apiError('RATE_LIMITED', 'Too many requests', 429, reqOrigin);
    }

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
      return apiError(
        'INVALID_REQUEST',
        firstError?.message || 'Invalid query parameters',
        400,
        reqOrigin
      );
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

    // Get total count and responses in parallel
    const [total, responses] = await Promise.all([
      prisma.response.count({ where }),
      prisma.response.findMany({
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
      }),
    ]);

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
      { headers: getCorsHeaders(reqOrigin) }
    );
  } catch (error) {
    console.error(
      'GET /api/v1/responses error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500, reqOrigin);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
