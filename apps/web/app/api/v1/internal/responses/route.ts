import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { submitResponseSchema } from '@/lib/validations';

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

export async function POST(request: NextRequest) {
  try {
    // Get API key from server-side env (not exposed to browser)
    const apiKeyString = process.env.GOTCHA_SDK_API;
    if (!apiKeyString) {
      console.error('GOTCHA_SDK_API not configured');
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'SDK not configured' } },
        { status: 500 }
      );
    }

    // Validate the API key exists in database
    const apiKey = await prisma.apiKey.findUnique({
      where: { key: apiKeyString },
      include: { project: true },
    });

    if (!apiKey || apiKey.revokedAt) {
      console.error('Invalid or revoked GOTCHA_SDK_API');
      return NextResponse.json(
        { error: { code: 'INVALID_API_KEY', message: 'Invalid API key' } },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = submitResponseSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues?.[0];
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: firstError?.message || 'Invalid request' } },
        { status: 400 }
      );
    }

    const data = validation.data;

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
    const response = await prisma.response.create({
      data: {
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
      },
    });

    return NextResponse.json({
      id: response.id,
      status: 'created',
      createdAt: response.createdAt.toISOString(),
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/v1/internal/responses error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key',
    },
  });
}
