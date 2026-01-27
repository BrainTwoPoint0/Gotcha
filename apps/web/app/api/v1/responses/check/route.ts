import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, apiError, corsHeaders } from '@/lib/api-auth';

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
    const elementId = searchParams.get('elementId');
    const userId = searchParams.get('userId');

    if (!elementId) {
      return apiError('INVALID_REQUEST', 'elementId is required', 400);
    }

    if (!userId) {
      return apiError('INVALID_REQUEST', 'userId is required', 400);
    }

    // Check for existing response
    const existingResponse = await prisma.response.findFirst({
      where: {
        projectId: apiKey.projectId,
        elementIdRaw: elementId,
        endUserId: userId,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        mode: true,
        content: true,
        title: true,
        rating: true,
        vote: true,
        pollOptions: true,
        pollSelected: true,
        createdAt: true,
      },
    });

    if (!existingResponse) {
      return Response.json({ exists: false }, { headers: corsHeaders });
    }

    // Map mode back to SDK format
    const modeMap: Record<string, string> = {
      FEEDBACK: 'feedback',
      VOTE: 'vote',
      POLL: 'poll',
      FEATURE_REQUEST: 'feature-request',
      AB: 'ab',
    };

    return Response.json(
      {
        exists: true,
        response: {
          id: existingResponse.id,
          mode: modeMap[existingResponse.mode] || existingResponse.mode.toLowerCase(),
          content: existingResponse.content,
          title: existingResponse.title,
          rating: existingResponse.rating,
          vote: existingResponse.vote?.toLowerCase() || null,
          pollOptions: existingResponse.pollOptions,
          pollSelected: existingResponse.pollSelected,
          createdAt: existingResponse.createdAt.toISOString(),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('GET /api/v1/responses/check error:', error);
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
