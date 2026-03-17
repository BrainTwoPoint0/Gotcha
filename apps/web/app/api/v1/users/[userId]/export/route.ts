import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, apiError, getCorsHeaders } from '@/lib/api-auth';
import { checkReadRateLimit, type PlanType } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// Map Prisma enums back to SDK strings
const modeMap: Record<string, string> = {
  FEEDBACK: 'feedback',
  VOTE: 'vote',
  POLL: 'poll',
  FEATURE_REQUEST: 'feature-request',
  AB: 'ab',
  NPS: 'nps',
};

// GET /api/v1/users/:userId/export - Export all user data (GDPR right to data portability)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const reqOrigin = request.headers.get('origin');
  try {
    const { userId } = await params;

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

    // Scope to the API key's project only (not org-wide)
    const responses = await prisma.response.findMany({
      where: {
        projectId: apiKey.projectId,
        endUserId: userId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50000,
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
        endUserMeta: true,
        url: true,
        createdAt: true,
      },
    });

    if (responses.length === 0) {
      return apiError('USER_NOT_FOUND', 'No responses found for this user ID', 404, reqOrigin);
    }

    // Collect all metadata ever submitted
    const allMetadata: Record<string, unknown> = {};
    responses.forEach((r) => {
      const meta = r.endUserMeta as Record<string, unknown>;
      if (meta) {
        Object.entries(meta).forEach(([key, value]) => {
          if (key !== 'id' && value !== undefined && value !== null) {
            // Keep the most recent value for each key
            if (allMetadata[key] === undefined) {
              allMetadata[key] = value;
            }
          }
        });
      }
    });

    // Transform responses
    const exportedResponses = responses.map((r) => ({
      id: r.id,
      elementId: r.elementIdRaw,
      mode: modeMap[r.mode] || r.mode.toLowerCase(),
      content: r.content,
      title: r.title,
      rating: r.rating,
      vote: r.vote?.toLowerCase() || null,
      pollOptions: r.pollOptions,
      pollSelected: r.pollSelected,
      experimentId: r.experimentId,
      variant: r.variant,
      url: r.url,
      createdAt: r.createdAt.toISOString(),
    }));

    return Response.json(
      {
        userId,
        exportedAt: new Date().toISOString(),
        responses: exportedResponses,
        metadata: allMetadata,
      },
      { headers: getCorsHeaders(reqOrigin) }
    );
  } catch (error) {
    console.error('GET /api/v1/users/:userId/export error:', error);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500, reqOrigin);
  }
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request.headers.get('origin')),
  });
}
