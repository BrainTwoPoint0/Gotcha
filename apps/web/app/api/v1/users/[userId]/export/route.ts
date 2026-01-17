import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, apiError } from '@/lib/api-auth';

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
};

// GET /api/v1/users/:userId/export - Export all user data (GDPR right to data portability)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;

    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return apiError(authResult.error.code, authResult.error.message, authResult.error.status);
    }

    const { apiKey } = authResult;

    // Find all projects in the organization
    const projectIds = await prisma.project.findMany({
      where: { organizationId: apiKey.organizationId },
      select: { id: true },
    });

    const projectIdList = projectIds.map((p) => p.id);

    // Find all responses for this user
    const responses = await prisma.response.findMany({
      where: {
        projectId: { in: projectIdList },
        endUserId: userId,
      },
      orderBy: { createdAt: 'desc' },
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
      return apiError('USER_NOT_FOUND', 'No responses found for this user ID', 404);
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

    return Response.json({
      userId,
      exportedAt: new Date().toISOString(),
      responses: exportedResponses,
      metadata: allMetadata,
    });
  } catch (error) {
    console.error('GET /api/v1/users/:userId/export error:', error);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
