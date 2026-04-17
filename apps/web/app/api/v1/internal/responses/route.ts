import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { submitResponseSchema } from '@/lib/validations';
import { createHash } from 'crypto';
import { isInternalOriginAllowed } from '@/lib/origin-check';
import { checkRateLimit } from '@/lib/rate-limit';
import { fireWebhooks } from '@/lib/webhooks';
import { sendBugReportEmail } from '@/lib/emails/send';
import { parseScreenshotDataUrl, uploadScreenshot } from '@/lib/screenshots';

/**
 * Internal API route for the Gotcha website's own SDK usage.
 * Uses server-side API key - nothing exposed to browser.
 */

type ResponseMode = 'FEEDBACK' | 'VOTE' | 'POLL' | 'FEATURE_REQUEST' | 'AB' | 'NPS';
type VoteType = 'UP' | 'DOWN';

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

// Cache the API key lookup with 5-minute TTL
let cachedApiKey: { projectId: string; organizationId: string; plan: string } | null = null;
let cachedKeyHash: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getInternalApiKey() {
  const apiKeyString = process.env.GOTCHA_SDK_API;
  if (!apiKeyString) return null;

  const keyHash = createHash('sha256').update(apiKeyString).digest('hex');

  // Return cached if hash matches and TTL not expired
  if (cachedApiKey && cachedKeyHash === keyHash && Date.now() - cachedAt < CACHE_TTL_MS)
    return cachedApiKey;

  const apiKey = await prisma.apiKey.findFirst({
    where: { keyHash, revokedAt: null },
    select: {
      projectId: true,
      project: {
        select: {
          organizationId: true,
          organization: { select: { subscription: { select: { plan: true } } } },
        },
      },
    },
  });

  if (apiKey) {
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

export async function POST(request: NextRequest) {
  // Per-stage wall-clock markers matching the public /api/v1/responses
  // pipeline. Makes this endpoint correlatable with the SDK's client-side
  // click→ack measurement in browser devtools (Network → Timing tab) so
  // the dogfood widget doubles as a production canary for submission
  // latency. Zero overhead beyond performance.now().
  const pipelineT0 = performance.now();
  const stages: Record<string, number> = {};
  const mark = (name: string, startedAt: number) => {
    stages[name] = Math.round((performance.now() - startedAt) * 10) / 10;
  };

  try {
    // Only allow requests from the same origin (our own website)
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (!isInternalOriginAllowed(origin, host)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Cross-origin requests not allowed' } },
        { status: 403 }
      );
    }

    // Run rate limit + body parsing + API key lookup in parallel
    const tGuards = performance.now();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const [rateLimit, body, apiKey] = await Promise.all([
      checkRateLimit(`internal:${ip}`, 'free'),
      request.json(),
      getInternalApiKey(),
    ]);
    mark('guards', tGuards);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
        { status: 429 }
      );
    }

    if (!apiKey) {
      console.error('GOTCHA_SDK_API not configured or invalid');
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'SDK not configured' } },
        { status: 500 }
      );
    }

    // Validate request body
    const tValidate = performance.now();
    const validation = submitResponseSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues?.[0];
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: firstError?.message || 'Invalid request' } },
        { status: 400 }
      );
    }
    mark('validate', tValidate);

    const data = validation.data as typeof validation.data & {
      experimentId?: string;
      variant?: string;
    };

    // Generate ID and timestamp up front so we can respond immediately
    const responseId = crypto.randomUUID();
    const createdAt = new Date();

    // --- Respond immediately after validation ---
    // DB writes happen async (fire-and-forget), same pattern as external API
    const tWrite = performance.now();
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

        // Create response
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
            createdAt,
            isBug: data.isBug || false,
          },
        });

        // Screenshot persistence — mirrors the public /api/v1/responses
        // handler. See lib/screenshots.ts for validation + upload details.
        // A failure here is logged and swallowed; we never want the
        // screenshot pipeline to lose the user's actual feedback content.
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
                console.warn('screenshot path persist failed (internal)', {
                  responseId,
                  message: err instanceof Error ? err.message : 'unknown',
                });
              }
            }
          } else {
            console.warn('screenshot parse rejected (internal)', {
              responseId,
              reason: parsed.reason,
            });
          }
        }

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
        console.error('Async DB write failed for internal response:', responseId, err);
      }
    };

    // Await DB writes to ensure they complete on serverless (Netlify)
    await asyncWrite();
    mark('write', tWrite);

    // Fire webhooks (non-blocking)
    fireWebhooks(apiKey.projectId, 'response.created', {
      id: responseId,
      elementId: data.elementId,
      mode: data.mode,
      content: data.content,
      rating: data.rating,
      vote: data.vote,
      createdAt: createdAt.toISOString(),
    }).catch(console.error);

    stages.total = Math.round((performance.now() - pipelineT0) * 10) / 10;
    const serverTiming = Object.entries(stages)
      .map(([name, dur]) => `${name};dur=${dur}`)
      .join(', ');

    return NextResponse.json(
      {
        id: responseId,
        status: 'created',
        createdAt: createdAt.toISOString(),
      },
      { status: 201, headers: { 'Server-Timing': serverTiming } }
    );
  } catch (error) {
    console.error('POST /api/v1/internal/responses error:', error);
    stages.total = Math.round((performance.now() - pipelineT0) * 10) / 10;
    const serverTiming = Object.entries(stages)
      .map(([name, dur]) => `${name};dur=${dur}`)
      .concat('failed;dur=0')
      .join(', ');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500, headers: { 'Server-Timing': serverTiming } }
    );
  }
}

// No OPTIONS/CORS — internal endpoints are same-origin only
