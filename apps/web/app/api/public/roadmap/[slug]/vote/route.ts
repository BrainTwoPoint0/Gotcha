import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { upvoteLimiter } from '@/lib/rate-limit';
import { computeVoterHash } from '@/lib/vote-hash';

/**
 * Anonymous upvote endpoint for the public roadmap.
 *
 * POST /api/public/roadmap/[slug]/vote  body: { responseId: string }
 *
 * Flow:
 *   1. Extract IP from x-forwarded-for (first hop). Require it in prod.
 *   2. Per-IP rate limit (10 votes per 5 min).
 *   3. Resolve project by slug + settings.roadmapEnabled = true.
 *      Fail-closed: >1 match or 0 matches = 404.
 *   4. Verify response belongs to the project, is in lifecycle status,
 *      and has an admin-curated title (same publication bar the public
 *      page enforces).
 *   5. Lazy-generate project.votingSalt on first vote. Atomic conditional
 *      update prevents two concurrent first-votes setting different salts.
 *   6. Compute voterHash.
 *   7. Transactionally: insert RoadmapVote + increment counter; on unique
 *      violation (same hash already voted) delete + decrement = toggle off.
 *   8. revalidatePath('/roadmap/[slug]') so the ISR cache reflects immediately.
 *
 * No cookies. No auth. No email. The unique constraint is the dedup AND
 * the toggle-off authorisation primitive: a browser returning with the
 * same IP+UA hashes identically and can remove its own vote.
 */
export const dynamic = 'force-dynamic';

interface ProjectSettings {
  roadmapEnabled?: boolean;
}

function extractIp(request: NextRequest): string | null {
  // Platform-trusted headers only. Both Vercel and Fly set these from the
  // edge and do NOT allow client code to override them — unlike
  // `x-forwarded-for`, which on Vercel is *appended to* incoming headers
  // (so `split(',')[0]` returns an attacker-controlled value when the
  // client sets it). Using the wrong header silently converts this
  // endpoint into a vote-stuffing amplifier via header spoofing.
  //
  // Order: platform-specific → `x-real-ip` (overwritten by most CDNs) →
  // NextRequest.ip (Vercel-provided) → dev-only fallback → reject.
  const vercel = request.headers.get('x-vercel-forwarded-for');
  if (vercel) {
    const first = vercel.split(',')[0]?.trim();
    if (first) return first;
  }
  const fly = request.headers.get('fly-client-ip');
  if (fly) return fly.trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  // NextRequest exposes request.ip from the platform. Undefined off-Vercel.
  const direct = (request as unknown as { ip?: string }).ip;
  if (direct) return direct;
  if (process.env.NODE_ENV === 'development') return 'dev-local';
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Bound slug length before any DB work; saves an unnecessary rate-limit +
    // Prisma round trip when a bad actor sends multi-MB paths.
    if (typeof slug !== 'string' || slug.length === 0 || slug.length > 128) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }

    const ip = extractIp(request);
    if (!ip) {
      return NextResponse.json({ error: 'Missing client IP' }, { status: 400 });
    }

    // 1. Per-IP rate limit (10 / 5 min).
    const { success: withinLimit } = await upvoteLimiter.limit(ip);
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many votes — try again shortly' }, { status: 429 });
    }

    let body: { responseId?: unknown };
    try {
      body = (await request.json()) as { responseId?: unknown };
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    if (
      typeof body.responseId !== 'string' ||
      body.responseId.length === 0 ||
      body.responseId.length > 64
    ) {
      return NextResponse.json({ error: 'Invalid `responseId`' }, { status: 400 });
    }
    const responseId = body.responseId;

    // 2. Resolve project by public-enabled slug. Same fail-closed pattern
    // the public page uses — partial unique index prevents legitimate
    // collisions, but we defend against >1 match anyway.
    const candidates = await prisma.project.findMany({
      where: {
        slug,
        settings: { path: ['roadmapEnabled'], equals: true },
      },
      select: { id: true, votingSalt: true },
      take: 2,
    });
    if (candidates.length !== 1) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }
    const project = candidates[0];

    // 3. Verify the response is legitimately on this roadmap.
    const response = await prisma.response.findFirst({
      where: {
        id: responseId,
        projectId: project.id,
        status: { in: ['PLANNED', 'IN_PROGRESS', 'SHIPPED'] },
        title: { not: null },
      },
      select: { id: true },
    });
    if (!response) {
      return NextResponse.json({ error: 'Response not on this roadmap' }, { status: 404 });
    }

    // 4. Lazy-generate the project salt. The conditional update is atomic —
    // two concurrent first-votes race but only one sets the salt; the loser
    // sees the winner's salt on the re-read below.
    let salt = project.votingSalt;
    if (!salt) {
      const generated =
        globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await prisma.project.updateMany({
        where: { id: project.id, votingSalt: null },
        data: { votingSalt: generated },
      });
      const refreshed = await prisma.project.findUnique({
        where: { id: project.id },
        select: { votingSalt: true },
      });
      salt = refreshed?.votingSalt ?? generated;
    }

    // 5. Compute voterHash.
    const voterHash = computeVoterHash({
      ip,
      userAgent: request.headers.get('user-agent'),
      projectSalt: salt,
    });

    // 6. Try-insert, on-conflict-toggle-off. Wrapped in a single transaction
    // so the RoadmapVote row and the materialised counter always move
    // together. On successful insert: increment. On unique-violation (the
    // same voterHash has already voted on this response): delete + decrement.
    let voted = false;
    let count = 0;
    try {
      const [, updated] = await prisma.$transaction([
        prisma.roadmapVote.create({
          data: { responseId, voterHash },
        }),
        prisma.response.update({
          where: { id: responseId },
          data: { upvoteCount: { increment: 1 } },
          select: { upvoteCount: true },
        }),
      ]);
      voted = true;
      count = updated.upvoteCount;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // Returning voter — toggle off.
        const [, updated] = await prisma.$transaction([
          prisma.roadmapVote.delete({
            where: {
              responseId_voterHash: { responseId, voterHash },
            },
          }),
          prisma.response.update({
            where: { id: responseId },
            data: { upvoteCount: { decrement: 1 } },
            select: { upvoteCount: true },
          }),
        ]);
        voted = false;
        count = Math.max(0, updated.upvoteCount);
      } else {
        throw err;
      }
    }

    // 7. Bust the ISR cache so the public page reflects the new count.
    try {
      revalidatePath(`/roadmap/${slug}`);
    } catch {
      /* no-op outside request context */
    }

    return NextResponse.json({ count, voted });
  } catch (error) {
    console.error('POST /api/public/roadmap/[slug]/vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
