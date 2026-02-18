import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Internal update route for the Gotcha website's own SDK usage.
 * Uses server-side API key — nothing exposed to browser.
 */

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

    const apiKeyString = process.env.GOTCHA_SDK_API;
    if (!apiKeyString) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'SDK not configured' } },
        { status: 500 }
      );
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { key: apiKeyString },
    });

    if (!apiKey || apiKey.revokedAt) {
      return NextResponse.json(
        { error: { code: 'INVALID_API_KEY', message: 'Invalid API key' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateResponseSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues?.[0];
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: firstError?.message || 'Invalid request body' } },
        { status: 400 }
      );
    }

    const data = validation.data;

    const existingResponse = await prisma.response.findUnique({
      where: { id },
      select: { id: true, projectId: true, endUserId: true },
    });

    if (!existingResponse || existingResponse.projectId !== apiKey.projectId) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Response not found' } },
        { status: 404 }
      );
    }

    const userId = request.nextUrl.searchParams.get('userId');
    if (userId && existingResponse.endUserId !== userId) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'You do not own this response' } },
        { status: 403 }
      );
    }

    const modeMap: Record<string, string> = {
      FEEDBACK: 'feedback',
      VOTE: 'vote',
      POLL: 'poll',
      FEATURE_REQUEST: 'feature-request',
      AB: 'ab',
    };

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

    return NextResponse.json({
      id: updatedResponse.id,
      status: 'updated',
      mode: modeMap[updatedResponse.mode] || updatedResponse.mode.toLowerCase(),
      content: updatedResponse.content,
      title: updatedResponse.title,
      rating: updatedResponse.rating,
      vote: updatedResponse.vote?.toLowerCase() || null,
      pollOptions: updatedResponse.pollOptions,
      pollSelected: updatedResponse.pollSelected,
      createdAt: updatedResponse.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('PATCH /api/v1/internal/responses/[id] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
