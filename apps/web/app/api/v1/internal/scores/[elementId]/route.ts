import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ResponseMode } from '@prisma/client';
import { isOriginAllowed } from '@/lib/origin-check';
import { calculateNPS } from '@/lib/nps';
import { createHash } from 'crypto';

let cachedApiKey: { projectId: string } | null = null;
let cachedKeyHash: string | null = null;

async function getInternalApiKey() {
  const apiKeyString = process.env.GOTCHA_SDK_API;
  if (!apiKeyString) return null;

  const keyHash = createHash('sha256').update(apiKeyString).digest('hex');

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ elementId: string }> }
) {
  try {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (!isOriginAllowed(origin, host)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Cross-origin requests not allowed' } },
        { status: 403 }
      );
    }

    const apiKey = await getInternalApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Internal API key not configured' } },
        { status: 500 }
      );
    }

    const { elementId } = await params;

    const where = {
      projectId: apiKey.projectId,
      elementIdRaw: elementId,
      gated: false,
    };

    const [aggregate, voteGroups, npsRatings] = await Promise.all([
      prisma.response.aggregate({
        where,
        _count: true,
        _avg: { rating: true },
      }),

      prisma.response.groupBy({
        by: ['vote'],
        where: { ...where, vote: { not: null } },
        _count: true,
      }),

      prisma.response.findMany({
        where: { ...where, mode: ResponseMode.NPS, rating: { not: null } },
        select: { rating: true },
      }),
    ]);

    const voteCount = { up: 0, down: 0 };
    for (const group of voteGroups) {
      if (group.vote === 'UP') voteCount.up = group._count;
      else if (group.vote === 'DOWN') voteCount.down = group._count;
    }

    const totalVotes = voteCount.up + voteCount.down;
    const positiveRate = totalVotes > 0 ? Math.round((voteCount.up / totalVotes) * 100) : null;

    const npsValues = npsRatings.map((r) => r.rating!);
    const npsResult = calculateNPS(npsValues);

    const ratingCount = await prisma.response.count({
      where: { ...where, rating: { not: null }, mode: { not: ResponseMode.NPS } },
    });

    return NextResponse.json({
      elementId,
      averageRating: aggregate._avg.rating ? Math.round(aggregate._avg.rating * 10) / 10 : null,
      totalResponses: aggregate._count,
      ratingCount,
      voteCount,
      positiveRate,
      npsScore: npsResult?.score ?? null,
    });
  } catch (error) {
    console.error('GET /api/v1/internal/scores/[elementId] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
