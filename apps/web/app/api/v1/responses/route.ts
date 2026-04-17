import { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
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
import { parseScreenshotDataUrl, uploadScreenshot } from '@/lib/screenshots';

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

  // Per-stage wall-clock markers for Server-Timing. Lets us profile the
  // hot path from browser devtools + production logs without a dedicated
  // APM. Each segment ending writes to `stages[name] = ms`. The header
  // is emitted on the success response; error paths skip it.
  const pipelineT0 = performance.now();
  const stages: Record<string, number> = {};
  const mark = (name: string, startedAt: number) => {
    stages[name] = Math.round((performance.now() - startedAt) * 10) / 10;
  };

  try {
    const tAuth = performance.now();
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
    mark('auth', tAuth);

    const { apiKey } = authResult;

    // Parse body first (can fail with invalid JSON). Up-front content-length
    // check so a hostile caller can't make us buffer ~5MB of junk before
    // Zod's 2.8MB cap fires. 3MB is the tightest bound that still covers a
    // full 2MB base64 screenshot plus the surrounding JSON envelope with
    // comfortable headroom for context metadata.
    const contentLengthHeader = request.headers.get('content-length');
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (Number.isFinite(contentLength) && contentLength > 3_145_728) {
        return apiError('PAYLOAD_TOO_LARGE', 'Request body exceeds 3MB limit', 413, reqOrigin);
      }
    }

    const idempotencyKey = request.headers.get('idempotency-key');
    const planKey = apiKey.plan.toLowerCase() as PlanType;

    const tBody = performance.now();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError('INVALID_REQUEST', 'Invalid JSON body', 400, reqOrigin);
    }
    mark('body', tBody);

    // Check rate limit + idempotency in parallel
    const tGuards = performance.now();
    const [rateLimit, idempotencyResult] = await Promise.all([
      checkRateLimit(apiKey.id, planKey),
      idempotencyKey ? checkIdempotency(idempotencyKey, apiKey.id) : Promise.resolve(null),
    ]);
    mark('guards', tGuards);

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
    const tValidate = performance.now();
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
    mark('validate', tValidate);

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
    const tWrite = performance.now();
    const asyncWrite = async () => {
      // Element upsert + usage increment are independent — run in parallel.
      // atomicIncrementUsage now returns the new count via RETURNING so we
      // don't need a follow-up findUnique to make the gating decision.
      const [element, newCount] = await Promise.all([
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

      // Check if this response exceeds the free limit. Use the count
      // returned from atomicIncrementUsage — saves a Subscription
      // round-trip on every FREE submission (80%+ of traffic).
      let gated = false;
      if (apiKey.plan === 'FREE' && newCount !== null) {
        gated = isOverLimit('FREE', newCount);

        if (shouldShowUpgradeWarning('FREE', newCount)) {
          // Range-based: even if counter skips exact thresholds under concurrency
          if (
            (newCount >= 400 && newCount < 450) ||
            (newCount >= 450 && newCount < 500) ||
            (newCount >= 500 && newCount < 550)
          ) {
            const threshold = newCount >= 500 ? 500 : newCount >= 450 ? 450 : 400;
            sendUsageWarningEmail(apiKey.organizationId, threshold, 500).catch(console.error);
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
          submitterEmail: data.userEmail ?? null,
          url: data.context?.url,
          userAgent: data.context?.userAgent,
          contextMeta: data.context
            ? {
                viewport: data.context.viewport,
                language: data.context.language,
                timezone: data.context.timezone,
                screenResolution: data.context.screenResolution,
                recentErrors: data.context.recentErrors,
              }
            : undefined,
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

      // Screenshot persistence — strictly opt-in (end user ticked bug flag +
      // customer enabled capture + capture succeeded client-side). Uploaded
      // to the private `gotcha-screenshots` bucket keyed by project + response
      // id. The path update is awaited inside a try so an orphaned object
      // is never left in the bucket without a matching DB pointer. A parse
      // or upload failure is logged and swallowed — a broken screenshot
      // must never lose the user's actual feedback content.
      if (data.screenshot && data.isBug) {
        const parsed = parseScreenshotDataUrl(data.screenshot);
        if (parsed.ok) {
          const path = await uploadScreenshot(apiKey.projectId, responseId, parsed.value);
          if (path) {
            try {
              await prisma.response.update({
                where: { id: responseId },
                data: { screenshotPath: path, screenshotCapturedAt: new Date() },
              });
            } catch (err) {
              console.warn('screenshot path persist failed', {
                responseId,
                message: err instanceof Error ? err.message : 'unknown',
              });
            }
          }
        } else {
          console.warn('screenshot parse rejected', {
            responseId,
            reason: parsed.reason,
          });
        }
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
        if (data.context?.viewport)
          descParts.push(
            `Viewport: ${data.context.viewport.width}x${data.context.viewport.height}`
          );
        if (data.context?.timezone) descParts.push(`Timezone: ${data.context.timezone}`);
        if (data.context?.recentErrors?.length) {
          const errorList = data.context.recentErrors
            .slice(0, 5)
            .map((e) => `- ${e.message}${e.source ? ` (${e.source})` : ''}`)
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
    mark('write', tWrite);

    // Invalidate cached analytics — debounced per project via Redis SETEX
    // NX so we fire the tag revalidation at most once every 30s per
    // project. Without the debounce, every submission thrashes the cache
    // on high-traffic projects and the GET /analytics endpoint never gets
    // a meaningful hit rate. Best-effort: any Redis failure falls back to
    // firing the revalidate (the pre-debounce behaviour).
    try {
      const debounceKey = `gotcha:analytics-revalidate:${apiKey.projectId}`;
      let shouldRevalidate = true;
      try {
        const claimed = await redis.set(debounceKey, '1', { nx: true, ex: 30 });
        shouldRevalidate = claimed !== null;
      } catch {
        // Redis down — fall through and revalidate anyway.
      }
      if (shouldRevalidate) {
        revalidateTag('analytics-overview');
      }
    } catch {
      /* no-op outside Next.js request context */
    }

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

    // Server-Timing — browser devtools surfaces these per-stage durations
    // under the Network panel's "Timing" tab. Total is tracked on the
    // server (pipelineT0) for correlation with the SDK's client-side
    // click→ack measurement.
    stages.total = Math.round((performance.now() - pipelineT0) * 10) / 10;
    const serverTiming = Object.entries(stages)
      .map(([name, dur]) => `${name};dur=${dur}`)
      .join(', ');

    return Response.json(result, {
      status: 201,
      headers: {
        ...getCorsHeaders(reqOrigin),
        ...rateLimit.headers,
        'Server-Timing': serverTiming,
      },
    });
  } catch (error) {
    console.error(
      'POST /api/v1/responses error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    // Emit Server-Timing on the failure path too. The stages that completed
    // before the throw let us see WHERE in the pipeline the 500 happened
    // (e.g. `auth;dur=12, body;dur=3` with no later stages → write failed).
    // Cheap to add, high-value for incident triage.
    stages.total = Math.round((performance.now() - pipelineT0) * 10) / 10;
    const serverTiming = Object.entries(stages)
      .map(([name, dur]) => `${name};dur=${dur}`)
      .concat('failed;dur=0')
      .join(', ');
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', status: 500 } },
      {
        status: 500,
        headers: { ...getCorsHeaders(reqOrigin), 'Server-Timing': serverTiming },
      }
    );
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
