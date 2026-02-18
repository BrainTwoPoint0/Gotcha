import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

/**
 * Internal check route for the Gotcha website's own SDK usage.
 * Uses server-side API key — nothing exposed to browser.
 */
export async function GET(request: NextRequest) {
  try {
    // Only allow requests from the same origin (our own website)
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Cross-origin requests not allowed' } },
        { status: 403 }
      );
    }

    const apiKeyString = process.env.GOTCHA_SDK_API;
    if (!apiKeyString) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'SDK not configured' } },
        { status: 500 }
      );
    }

    const keyHash = createHash('sha256').update(apiKeyString).digest('hex');
    const apiKey = await prisma.apiKey.findFirst({
      where: { keyHash, revokedAt: null },
    });

    if (!apiKey || apiKey.revokedAt) {
      return NextResponse.json(
        { error: { code: 'INVALID_API_KEY', message: 'Invalid API key' } },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const elementId = searchParams.get('elementId');
    const userId = searchParams.get('userId');

    if (!elementId || !userId) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'elementId and userId are required' } },
        { status: 400 }
      );
    }

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
      return NextResponse.json({ exists: false });
    }

    const modeMap: Record<string, string> = {
      FEEDBACK: 'feedback',
      VOTE: 'vote',
      POLL: 'poll',
      FEATURE_REQUEST: 'feature-request',
      AB: 'ab',
    };

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('GET /api/v1/internal/responses/check error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
