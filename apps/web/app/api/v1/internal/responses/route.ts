import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { submitResponseSchema } from '@/lib/validations';
import { createHash } from 'crypto';
import { isInternalOriginAllowed } from '@/lib/origin-check';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Internal API route for the Gotcha website's own SDK usage.
 * Uses server-side API key - nothing exposed to browser.
 */

type ResponseMode = 'FEEDBACK' | 'VOTE' | 'POLL' | 'FEATURE_REQUEST' | 'AB';
type VoteType = 'UP' | 'DOWN';

const modeMap: Record<string, ResponseMode> = {
  feedback: 'FEEDBACK',
  vote: 'VOTE',
  poll: 'POLL',
  'feature-request': 'FEATURE_REQUEST',
  ab: 'AB',
};

const voteMap: Record<string, VoteType> = {
  up: 'UP',
  down: 'DOWN',
};

// Cache the API key lookup to avoid a DB round-trip on every request
let cachedApiKey: { projectId: string } | null = null;
let cachedKeyHash: string | null = null;

async function getInternalApiKey() {
  const apiKeyString = process.env.GOTCHA_SDK_API;
  if (!apiKeyString) return null;

  const keyHash = createHash('sha256').update(apiKeyString).digest('hex');

  // Return cached if hash matches (same env var)
  if (cachedApiKey && cachedKeyHash === keyHash) return cachedApiKey;

  const apiKey = await prisma.apiKey.findFirst({
    where: { keyHash, revokedAt: null },
    select: { projectId: true },
  });

  if (apiKey) {
    cachedApiKey = apiKey;
    cachedKeyHash = keyHash;
  }

  return apiKey;
}

export async function POST(request: NextRequest) {
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
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const [rateLimit, body, apiKey] = await Promise.all([
      checkRateLimit(`internal:${ip}`, 'free'),
      request.json(),
      getInternalApiKey(),
    ]);

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
    const validation = submitResponseSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues?.[0];
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: firstError?.message || 'Invalid request' } },
        { status: 400 }
      );
    }

    const data = validation.data as typeof validation.data & {
      experimentId?: string;
      variant?: string;
    };

    // Generate ID and timestamp up front so we can respond immediately
    const responseId = crypto.randomUUID();
    const createdAt = new Date();

    // --- Respond immediately after validation ---
    // DB writes happen async (fire-and-forget), same pattern as external API
    const asyncWrite = async () => {
      try {
        // Get or create element
        let elementDbId: string;
        const existingElement = await prisma.element.findUnique({
          where: {
            projectId_elementId: {
              projectId: apiKey.projectId,
              elementId: data.elementId,
            },
          },
        });

        if (existingElement) {
          elementDbId = existingElement.id;
        } else {
          const newElement = await prisma.element.create({
            data: {
              projectId: apiKey.projectId,
              elementId: data.elementId,
            },
          });
          elementDbId = newElement.id;
        }

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
          },
        });
      } catch (err) {
        console.error('Async DB write failed for internal response:', responseId, err);
      }
    };

    // Await DB writes to ensure they complete on serverless (Netlify)
    await asyncWrite();

    return NextResponse.json(
      {
        id: responseId,
        status: 'created',
        createdAt: createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/v1/internal/responses error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// No OPTIONS/CORS — internal endpoints are same-origin only
