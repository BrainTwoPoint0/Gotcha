import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, apiError, corsHeaders } from '@/lib/api-auth';
import { z } from 'zod';

type VoteType = 'UP' | 'DOWN';

const voteMap: Record<string, VoteType> = {
  up: 'UP',
  down: 'DOWN',
};

const updateResponseSchema = z.object({
  content: z.string().max(10000).optional(),
  title: z.string().max(500).optional(),
  rating: z.number().min(1).max(5).optional(),
  vote: z.enum(['up', 'down']).optional(),
  pollSelected: z.array(z.string()).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return apiError(authResult.error.code, authResult.error.message, authResult.error.status);
    }

    const { apiKey } = authResult;

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validation = updateResponseSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues?.[0];
      return apiError('INVALID_REQUEST', firstError?.message || 'Invalid request body', 400);
    }

    const data = validation.data;

    // Find the existing response
    const existingResponse = await prisma.response.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        endUserId: true,
      },
    });

    if (!existingResponse) {
      return apiError('INVALID_REQUEST', 'Response not found', 404);
    }

    // Verify the response belongs to this project
    if (existingResponse.projectId !== apiKey.projectId) {
      return apiError('INVALID_REQUEST', 'Response not found', 404);
    }

    // Verify the user owns this response
    const userId = request.nextUrl.searchParams.get('userId');
    if (existingResponse.endUserId) {
      if (!userId || existingResponse.endUserId !== userId) {
        return apiError('INVALID_REQUEST', 'You do not own this response', 403);
      }
    }

    // Update the response
    const updatedResponse = await prisma.response.update({
      where: { id },
      data: {
        ...(data.content !== undefined && { content: data.content }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.vote !== undefined && { vote: voteMap[data.vote] }),
        ...(data.pollSelected !== undefined && { pollSelected: data.pollSelected }),
      },
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
        id: updatedResponse.id,
        status: 'updated' as const,
        mode: modeMap[updatedResponse.mode] || updatedResponse.mode.toLowerCase(),
        content: updatedResponse.content,
        title: updatedResponse.title,
        rating: updatedResponse.rating,
        vote: updatedResponse.vote?.toLowerCase() || null,
        pollOptions: updatedResponse.pollOptions,
        pollSelected: updatedResponse.pollSelected,
        createdAt: updatedResponse.createdAt.toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('PATCH /api/v1/responses/[id] error:', error);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return apiError(authResult.error.code, authResult.error.message, authResult.error.status);
    }

    const { apiKey } = authResult;

    // Find the response
    const response = await prisma.response.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        elementIdRaw: true,
        mode: true,
        content: true,
        title: true,
        rating: true,
        vote: true,
        pollOptions: true,
        pollSelected: true,
        endUserId: true,
        endUserMeta: true,
        createdAt: true,
      },
    });

    if (!response || response.projectId !== apiKey.projectId) {
      return apiError('INVALID_REQUEST', 'Response not found', 404);
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
        id: response.id,
        elementId: response.elementIdRaw,
        mode: modeMap[response.mode] || response.mode.toLowerCase(),
        content: response.content,
        title: response.title,
        rating: response.rating,
        vote: response.vote?.toLowerCase() || null,
        pollOptions: response.pollOptions,
        pollSelected: response.pollSelected,
        user: response.endUserId
          ? { id: response.endUserId, ...(response.endUserMeta as Record<string, unknown>) }
          : response.endUserMeta,
        createdAt: response.createdAt.toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('GET /api/v1/responses/[id] error:', error);
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
