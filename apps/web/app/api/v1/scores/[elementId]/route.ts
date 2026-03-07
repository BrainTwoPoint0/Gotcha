import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ResponseMode } from '@prisma/client';
import { validateApiKey, apiError, corsHeaders, getCorsHeaders } from '@/lib/api-auth';
import { calculateNPS } from '@/lib/nps';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ elementId: string }> }
) {
  const reqOrigin = request.headers.get('origin');
  try {
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return apiError(authResult.error.code, authResult.error.message, authResult.error.status, reqOrigin);
    }

    const { apiKey } = authResult;
    const { elementId } = await params;

    const where = {
      projectId: apiKey.projectId,
      elementIdRaw: elementId,
      gated: false,
    };

    // Run queries in parallel
    const [aggregate, voteGroups, npsRatings] = await Promise.all([
      // Total count + average rating
      prisma.response.aggregate({
        where,
        _count: true,
        _avg: { rating: true },
      }),

      // Vote counts grouped by vote type
      prisma.response.groupBy({
        by: ['vote'],
        where: { ...where, vote: { not: null } },
        _count: true,
      }),

      // NPS ratings (mode=NPS responses with a rating)
      prisma.response.findMany({
        where: { ...where, mode: ResponseMode.NPS, rating: { not: null } },
        select: { rating: true },
      }),
    ]);

    // Process vote counts
    const voteCount = { up: 0, down: 0 };
    for (const group of voteGroups) {
      if (group.vote === 'UP') voteCount.up = group._count;
      else if (group.vote === 'DOWN') voteCount.down = group._count;
    }

    const totalVotes = voteCount.up + voteCount.down;
    const positiveRate = totalVotes > 0 ? Math.round((voteCount.up / totalVotes) * 100) : null;

    // Calculate NPS
    const npsValues = npsRatings.map((r) => r.rating!);
    const npsResult = calculateNPS(npsValues);

    // Count responses that have a rating (for ratingCount)
    const ratingCount = await prisma.response.count({
      where: { ...where, rating: { not: null }, mode: { not: ResponseMode.NPS } },
    });

    const result = {
      elementId,
      averageRating: aggregate._avg.rating ? Math.round(aggregate._avg.rating * 10) / 10 : null,
      totalResponses: aggregate._count,
      ratingCount,
      voteCount,
      positiveRate,
      npsScore: npsResult?.score ?? null,
    };

    return Response.json(result, { headers: getCorsHeaders(reqOrigin) });
  } catch (error) {
    console.error('GET /api/v1/scores/[elementId] error:', error);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500, reqOrigin);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
